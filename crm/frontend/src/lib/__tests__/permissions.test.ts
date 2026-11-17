import { describe, it, expect } from 'vitest';
import { can } from '../permissions';

describe('can', () => {
  it('super_admin can do everything', () => {
    expect(can('super_admin', 'leads.read')).toBe(true);
    expect(can('super_admin', 'users.manage')).toBe(true);
  });
  it('read_only_analyst cannot manage revenue', () => {
    expect(can('read_only_analyst', 'revenue.manage')).toBe(false);
  });
  it('finance cannot create leads', () => {
    expect(can('finance', 'leads.create')).toBe(false);
  });
});
