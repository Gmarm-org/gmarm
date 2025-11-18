import type { SortDirection } from '../hooks/useTableFilters';

interface TableHeaderWithFiltersProps<T> {
  column: keyof T;
  label: string;
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  onSort: (key: keyof T) => void;
  align?: 'left' | 'center' | 'right';
}

export function TableHeaderWithFilters<T extends Record<string, any>>({
  column,
  label,
  sortKey,
  sortDirection,
  onSort,
  align = 'left',
}: TableHeaderWithFiltersProps<T>) {
  const isSorted = sortKey === column;
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th className={`px-4 py-3 ${alignmentClass} text-sm font-medium text-gray-700 bg-gray-50`}>
      <button
        onClick={() => onSort(column)}
        className={`flex items-center space-x-1 hover:text-gray-900 transition-colors w-full ${
          isSorted ? 'text-blue-600 font-semibold' : 'text-gray-700'
        }`}
      >
        <span>{label}</span>
        <div className="flex flex-col">
          {sortDirection === 'asc' && isSorted ? (
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : sortDirection === 'desc' && isSorted ? (
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-3 h-3 opacity-30" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
            </svg>
          )}
        </div>
      </button>
    </th>
  );
}

