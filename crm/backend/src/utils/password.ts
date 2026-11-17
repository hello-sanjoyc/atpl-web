import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

/** Format: scrypt$N$r$p$saltHex$hashHex */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltHex, hashHex] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Constant-cost dummy verification used to equalise response timing for unknown accounts. */
export const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$00000000000000000000000000000000$' + '00'.repeat(KEY_LENGTH);
