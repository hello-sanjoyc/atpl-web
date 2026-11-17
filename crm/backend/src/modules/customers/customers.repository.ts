import { and, asc, count, eq, gte, isNotNull, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { withDbTiming, type DbExecutor } from '../../db/client.js';
import { contacts, contracts, customers } from '../../db/schema/index.js';
import { escapeLike } from '../leads/leads.repository.js';

export type CustomerRow = typeof customers.$inferSelect;
export type ContractRow = typeof contracts.$inferSelect;

export async function findCustomerById(db: DbExecutor, id: string): Promise<CustomerRow | undefined> {
  const [row] = await withDbTiming('customers.find', () => db.select().from(customers).where(eq(customers.id, id)).limit(1));
  return row;
}

export async function findCustomerByEmail(db: DbExecutor, email: string): Promise<CustomerRow | undefined> {
  const [row] = await withDbTiming('customers.find_by_email', () =>
    db
      .select()
      .from(customers)
      .where(sql`lower(${customers.email}) = ${email.toLowerCase()}`)
      .limit(1),
  );
  return row;
}

export async function insertCustomer(db: DbExecutor, values: typeof customers.$inferInsert): Promise<CustomerRow> {
  const [row] = await withDbTiming('customers.insert', () => db.insert(customers).values(values).returning());
  if (!row) throw new Error('Customer insert returned no row');
  return row;
}

export async function updateCustomer(db: DbExecutor, id: string, patch: Partial<typeof customers.$inferInsert>): Promise<CustomerRow | undefined> {
  const [row] = await withDbTiming('customers.update', () =>
    db.update(customers).set({ ...patch, updatedAt: new Date() }).where(eq(customers.id, id)).returning(),
  );
  return row;
}

export async function listCustomers(
  db: DbExecutor,
  options: { q?: string; status?: string; limit: number; offset: number },
): Promise<{ rows: CustomerRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (options.status) conditions.push(eq(customers.status, options.status));
  if (options.q) {
    const pattern = `%${escapeLike(options.q)}%`;
    conditions.push(or(sql`${customers.name} ilike ${pattern}`, sql`${customers.email} ilike ${pattern}`, sql`${customers.company} ilike ${pattern}`)!);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  return withDbTiming('customers.list', async () => {
    const [rows, [total]] = await Promise.all([
      db.select().from(customers).where(where).orderBy(asc(customers.name)).limit(options.limit).offset(options.offset),
      db.select({ value: count() }).from(customers).where(where),
    ]);
    return { rows, total: Number(total?.value ?? 0) };
  });
}

export async function insertContact(db: DbExecutor, values: typeof contacts.$inferInsert) {
  const [row] = await withDbTiming('contacts.insert', () => db.insert(contacts).values(values).returning());
  if (!row) throw new Error('Contact insert returned no row');
  return row;
}

export async function listContacts(db: DbExecutor, customerId: string) {
  return withDbTiming('contacts.list', () => db.select().from(contacts).where(eq(contacts.customerId, customerId)).orderBy(asc(contacts.name)));
}

export async function insertContract(db: DbExecutor, values: typeof contracts.$inferInsert): Promise<ContractRow> {
  const [row] = await withDbTiming('contracts.insert', () => db.insert(contracts).values(values).returning());
  if (!row) throw new Error('Contract insert returned no row');
  return row;
}

export async function listContractsForCustomer(db: DbExecutor, customerId: string) {
  return withDbTiming('contracts.list_for_customer', () =>
    db.select().from(contracts).where(eq(contracts.customerId, customerId)).orderBy(asc(contracts.renewsOn)),
  );
}

/** Active contracts renewing on or before `renewsBefore` (YYYY-MM-DD) that have not been reminded. */
export async function listRenewalsDue(db: DbExecutor, options: { renewsOnOrBefore: string; renewsOnOrAfter?: string; onlyUnreminded?: boolean }) {
  const conditions: SQL[] = [eq(contracts.status, 'active'), isNotNull(contracts.renewsOn), lte(contracts.renewsOn, options.renewsOnOrBefore)];
  if (options.renewsOnOrAfter) conditions.push(gte(contracts.renewsOn, options.renewsOnOrAfter));
  if (options.onlyUnreminded) conditions.push(isNull(contracts.renewalReminderSentAt));
  return withDbTiming('contracts.renewals', () => db.select().from(contracts).where(and(...conditions)).orderBy(asc(contracts.renewsOn)));
}

export async function findContractById(db: DbExecutor, id: string): Promise<ContractRow | undefined> {
  const [row] = await withDbTiming('contracts.find', () => db.select().from(contracts).where(eq(contracts.id, id)).limit(1));
  return row;
}

export async function markRenewalReminded(db: DbExecutor, id: string, at: Date): Promise<void> {
  await withDbTiming('contracts.mark_reminded', () =>
    db.update(contracts).set({ renewalReminderSentAt: at, updatedAt: at }).where(eq(contracts.id, id)),
  );
}
