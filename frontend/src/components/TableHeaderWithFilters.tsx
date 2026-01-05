import { useState } from 'react';
import type { SortDirection } from '../hooks/useTableFilters';

interface TableHeaderWithFiltersProps<T> {
  column: keyof T;
  label: string;
  sortKey: keyof T | null;
  sortDirection: SortDirection;
  onSort: (key: keyof T) => void;
  align?: 'left' | 'center' | 'right';
  filterValue?: string;
  onFilterChange?: (key: keyof T, value: string) => void;
}

export function TableHeaderWithFilters<T extends Record<string, any>>({
  column,
  label,
  sortKey,
  sortDirection,
  onSort,
  align = 'left',
  filterValue = '',
  onFilterChange,
}: TableHeaderWithFiltersProps<T>) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isSorted = sortKey === column;
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th className={`px-2 py-2 ${alignmentClass} text-sm font-medium text-gray-700 bg-gray-50 relative`}>
      <div className="flex flex-col space-y-1">
        {/* Header con botón de ordenamiento y filtro separados */}
        <div className="flex items-center justify-between space-x-1 w-full">
          <button
            onClick={() => onSort(column)}
            className={`flex items-center space-x-1 hover:text-gray-900 transition-colors flex-1 ${
              isSorted ? 'text-blue-600 font-semibold' : 'text-gray-700'
            }`}
          >
            <span className="text-xs">{label}</span>
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
          {/* Botón de filtro separado */}
          {onFilterChange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
              }}
              className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                filterValue ? 'text-blue-600' : 'text-gray-400'
              }`}
              title="Filtrar"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Input de filtro */}
        {onFilterChange && isFilterOpen && (
          <input
            type="text"
            value={filterValue}
            onChange={(e) => onFilterChange(column, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Filtrar ${label.toLowerCase()}...`}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        )}
      </div>
    </th>
  );
}

