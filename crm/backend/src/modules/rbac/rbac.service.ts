import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import type { AppLogger } from '../../logger/index.js';
import type { CacheService } from '../../cache/cache.service.js';
import { rolePermissions, roleMeta } from '../../db/schema/platform.js';
import { PERMISSIONS, ROLES, type Permission, type Role } from '../../config/constants.js';

export type RolePermissionMap = Record<string, Set<string>>;

const CACHE_KEYS = {
  rolePermissions: 'rbac:role_permissions',
  roleConfigs:     'rbac:role_configs',
  roleMeta:        'rbac:role_meta',
} as const;

const TTL_S = 300; // 5 minutes in Redis

// ── Permission map (used by auth middleware) ──────────────────────────────────

/** Loads the granted permissions for all roles from Redis → DB, with TTL. */
export async function loadRolePermissions(
  db: Database,
  cache: CacheService,
  logger?: AppLogger,
): Promise<RolePermissionMap> {
  const cached = await cache.get<Record<string, string[]>>(CACHE_KEYS.rolePermissions);
  if (cached) {
    const map: RolePermissionMap = {};
    for (const [role, perms] of Object.entries(cached)) {
      map[role] = new Set(perms);
    }
    return map;
  }

  try {
    const rows = await db.select().from(rolePermissions);
    const map: RolePermissionMap = {};
    for (const role of ROLES) map[role] = new Set<string>();

    for (const row of rows) {
      if (row.granted && map[row.role]) {
        map[row.role]!.add(row.permission);
      }
    }

    // super_admin always retains all permissions regardless of DB state
    map['super_admin'] = new Set(PERMISSIONS);

    // Serialise Sets → arrays for Redis storage
    const serialisable: Record<string, string[]> = {};
    for (const [role, perms] of Object.entries(map)) {
      serialisable[role] = [...perms];
    }
    await cache.set(CACHE_KEYS.rolePermissions, serialisable, TTL_S);
    return map;
  } catch (err) {
    logger?.warn({ err }, 'Failed to load role permissions from DB, using static fallback');
    const { ROLE_PERMISSIONS } = await import('../../config/constants.js');
    const fallback: RolePermissionMap = {};
    for (const role of ROLES) {
      fallback[role] = new Set(ROLE_PERMISSIONS[role as Role] as readonly string[]);
    }
    return fallback;
  }
}

/** Returns the set of granted permissions for one role. */
export async function getPermissionsForRole(
  db: Database,
  cache: CacheService,
  role: string,
): Promise<Set<string>> {
  const map = await loadRolePermissions(db, cache);
  return map[role] ?? new Set();
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export interface RolePermissionRow {
  role: string;
  permission: string;
  granted: boolean;
}

export interface RoleConfig {
  role: string;
  permissions: RolePermissionRow[];
}

/** Returns the full permission matrix for all roles (built-ins + custom). Redis-cached for TTL_S. */
export async function listAllRoleConfigs(db: Database, cache: CacheService): Promise<RoleConfig[]> {
  const cached = await cache.get<RoleConfig[]>(CACHE_KEYS.roleConfigs);
  if (cached) return cached;

  // Load permission rows and all role slugs (built-in + custom) in parallel
  const [permRows, metaRows] = await Promise.all([
    db.select().from(rolePermissions).orderBy(rolePermissions.role, rolePermissions.permission),
    db.select({ role: roleMeta.role }).from(roleMeta),
  ]);

  // All known roles: built-ins first (canonical order), then custom ones
  const builtInSet = new Set(ROLES as readonly string[]);
  const customRoles = metaRows.map((r) => r.role).filter((r) => !builtInSet.has(r));
  const allRoles = [...ROLES, ...customRoles];

  const byRole: Record<string, RolePermissionRow[]> = {};
  for (const role of allRoles) byRole[role] = [];

  for (const row of permRows) {
    if (byRole[row.role]) {
      byRole[row.role]!.push({ role: row.role, permission: row.permission, granted: row.granted });
    }
  }

  const result = allRoles.map((role) => ({ role, permissions: byRole[role] ?? [] }));
  await cache.set(CACHE_KEYS.roleConfigs, result, TTL_S);
  return result;
}

export interface UpdateRolePermissionsInput {
  permissions: Partial<Record<string, boolean>>;
}

/** Upserts the granted flags for a role. super_admin rows are ignored (always all). */
export async function updateRolePermissions(
  db: Database,
  cache: CacheService,
  role: string,
  input: UpdateRolePermissionsInput,
  actorId: string,
): Promise<RoleConfig> {
  if (role === 'super_admin') {
    throw Object.assign(new Error('super_admin permissions cannot be changed'), { statusCode: 403 });
  }

  // Allow both built-in roles and custom roles stored in role_meta
  if (!ROLES.includes(role as Role)) {
    const [metaRow] = await db.select({ role: roleMeta.role }).from(roleMeta).where(eq(roleMeta.role, role));
    if (!metaRow) {
      throw Object.assign(new Error(`Unknown role: ${role}`), { statusCode: 404 });
    }
  }

  const entries = Object.entries(input.permissions).filter(([perm]) =>
    PERMISSIONS.includes(perm as Permission),
  );

  if (entries.length > 0) {
    await db.transaction(async (tx) => {
      for (const [permission, granted] of entries) {
        await tx
          .insert(rolePermissions)
          .values({ role, permission, granted: granted ?? false, updatedBy: actorId })
          .onConflictDoUpdate({
            target: [rolePermissions.role, rolePermissions.permission],
            set: { granted: granted ?? false, updatedBy: actorId, updatedAt: new Date() },
          });
      }
    });
  }

  await Promise.all([
    cache.del(CACHE_KEYS.rolePermissions),
    cache.del(CACHE_KEYS.roleConfigs),
    cache.publish({ type: 'rbac.permissions_updated', queryKeys: [['role-meta'], ['rbac-configs']] }),
  ]);

  const rows = await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  return { role, permissions: rows.map((r) => ({ role: r.role, permission: r.permission, granted: r.granted })) };
}

// ── Role metadata (label + description) ──────────────────────────────────────

export interface RoleMetaRow {
  role: string;
  label: string;
  description: string;
}

const DEFAULT_LABELS: Record<string, string> = {
  super_admin:        'Super Admin',
  sales_manager:      'Sales Manager',
  sales_executive:    'Sales Executive',
  marketing_manager:  'Marketing Manager',
  finance:            'Finance',
  read_only_analyst:  'Read Only Analyst',
};

/** Returns label+description for every role (built-ins + custom). Redis-cached for TTL_S. */
export async function listRoleMeta(db: Database, cache: CacheService): Promise<RoleMetaRow[]> {
  const cached = await cache.get<RoleMetaRow[]>(CACHE_KEYS.roleMeta);
  if (cached) return cached;

  const rows = await db.select().from(roleMeta);
  const byRole = Object.fromEntries(rows.map((r) => [r.role, r]));

  const builtIn = ROLES.map((role) => ({
    role,
    label: byRole[role]?.label ?? DEFAULT_LABELS[role] ?? role,
    description: byRole[role]?.description ?? '',
  }));
  const builtInSet = new Set(ROLES as readonly string[]);
  const custom = rows
    .filter((r) => !builtInSet.has(r.role))
    .map((r) => ({ role: r.role, label: r.label, description: r.description }));

  const result = [...builtIn, ...custom];
  await cache.set(CACHE_KEYS.roleMeta, result, TTL_S);
  return result;
}

/** Upserts label and description for an existing built-in role. */
export async function upsertRoleMeta(
  db: Database,
  cache: CacheService,
  role: string,
  patch: { label: string; description: string },
  actorId: string,
): Promise<RoleMetaRow> {
  if (!ROLES.includes(role as Role)) {
    throw Object.assign(new Error(`Unknown role: ${role}`), { statusCode: 404 });
  }

  await db.execute(sql`
    INSERT INTO role_meta (role, label, description, updated_by, updated_at)
    VALUES (${role}, ${patch.label}, ${patch.description}, ${actorId}, now())
    ON CONFLICT (role) DO UPDATE
      SET label = EXCLUDED.label,
          description = EXCLUDED.description,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
  `);

  await Promise.all([
    cache.del(CACHE_KEYS.roleMeta),
    cache.del(CACHE_KEYS.roleConfigs),
    cache.publish({ type: 'rbac.role_meta_updated', queryKeys: [['role-meta'], ['rbac-configs']] }),
  ]);
  return { role, label: patch.label, description: patch.description };
}

/** Creates a brand-new custom role in role_meta. Errors if the slug already exists. */
export async function createRoleMeta(
  db: Database,
  cache: CacheService,
  role: string,
  data: { label: string; description: string },
  actorId: string,
): Promise<RoleMetaRow> {
  if (!/^[a-z][a-z0-9_]{1,49}$/.test(role)) {
    throw Object.assign(
      new Error('Role slug must start with a letter and contain only lowercase letters, digits, and underscores (2–50 chars)'),
      { statusCode: 400 },
    );
  }
  if (ROLES.includes(role as Role)) {
    throw Object.assign(new Error(`Role "${role}" already exists as a built-in role`), { statusCode: 409 });
  }

  const result = await db.execute(sql`
    INSERT INTO role_meta (role, label, description, updated_by, updated_at)
    VALUES (${role}, ${data.label}, ${data.description}, ${actorId}, now())
    ON CONFLICT (role) DO NOTHING
    RETURNING role
  `);

  if (!result.rows.length) {
    throw Object.assign(new Error(`A role with slug "${role}" already exists`), { statusCode: 409 });
  }

  await Promise.all([
    cache.del(CACHE_KEYS.roleMeta),
    cache.del(CACHE_KEYS.roleConfigs),
    cache.publish({ type: 'rbac.role_meta_updated', queryKeys: [['role-meta'], ['rbac-configs']] }),
  ]);
  return { role, label: data.label, description: data.description };
}
