import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  disabled?: boolean;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const exportOptions = [
    { format: 'pdf' as const, label: 'PDF Report' },
    { format: 'excel' as const, label: 'Excel Spreadsheet' },
    { format: 'csv' as const, label: 'CSV Data' }
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => {
                  onExport(option.format);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
