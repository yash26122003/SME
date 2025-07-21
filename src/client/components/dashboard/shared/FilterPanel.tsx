import React from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  id: string;
  label: string;
  value: any;
  type: 'select' | 'date' | 'range' | 'multi-select';
  options?: { label: string; value: any }[];
}

interface FilterPanelProps {
  filters: FilterOption[];
  activeFilters: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onClearFilters: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFilterCount = Object.keys(activeFilters).filter(
    key => activeFilters[key] !== null && activeFilters[key] !== undefined
  ).length;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FunnelIcon className="w-4 h-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' && (
                    <select
                      value={activeFilters[filter.id] || ''}
                      onChange={(e) => onFilterChange(filter.id, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">All</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === 'date' && (
                    <input
                      type="date"
                      value={activeFilters[filter.id] || ''}
                      onChange={(e) => onFilterChange(filter.id, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
