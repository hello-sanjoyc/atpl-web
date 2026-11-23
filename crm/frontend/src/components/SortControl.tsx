import { FilterSelect } from './FilterBar';

export interface SortOption {
  value: string;
  label: string;
}

export function SortControl({
  sort,
  order,
  onSortChange,
  onOrderChange,
  options,
}: {
  sort: string;
  order: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  onOrderChange: (value: 'asc' | 'desc') => void;
  options: SortOption[];
}) {
  return (
    <>
      <FilterSelect value={sort} onChange={onSortChange} options={options} placeholder="Sort by" />
      <FilterSelect
        value={order}
        onChange={(v) => onOrderChange(v as 'asc' | 'desc')}
        options={[
          { value: 'asc', label: 'Ascending' },
          { value: 'desc', label: 'Descending' },
        ]}
        placeholder="Order"
      />
    </>
  );
}
