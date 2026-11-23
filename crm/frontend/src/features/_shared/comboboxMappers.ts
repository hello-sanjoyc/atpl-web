import type { AsyncComboboxOption } from '../../components/form/AsyncCombobox';
import type { Lead, Customer, Opportunity, Contract } from './types';

export function mapLead(row: unknown): AsyncComboboxOption {
  const l = row as Lead;
  return { id: l.id, label: l.name, sublabel: l.email };
}

export function mapCustomer(row: unknown): AsyncComboboxOption {
  const c = row as Customer;
  return { id: c.id, label: c.name, sublabel: c.email };
}

export function mapOpportunity(row: unknown): AsyncComboboxOption {
  const o = row as Opportunity;
  return { id: o.id, label: o.title, sublabel: `${o.currency} ${o.estimatedValue}` };
}

export function contractToOption(c: Contract): AsyncComboboxOption {
  return { id: c.id, label: c.name, sublabel: `${c.currency} ${c.value}` };
}
