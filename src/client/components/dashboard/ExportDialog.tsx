import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ 
  isOpen, 
  onClose, 
  onExport, 
  title = 'Export Dashboard' 
}) => {
  if (!isOpen) return null;

  const exportFormats = [
    { value: 'pdf' as const, label: 'PDF Report', description: 'High-quality PDF with charts and data' },
    { value: 'excel' as const, label: 'Excel Workbook', description: 'Spreadsheet with raw data and charts' },
    { value: 'csv' as const, label: 'CSV Data', description: 'Raw data in CSV format' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {exportFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => {
                    onExport(format.value);
                    onClose();
                  }}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="font-medium text-gray-900">{format.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
