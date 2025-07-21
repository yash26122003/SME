import React from 'react';
import { PlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface WidgetControlsProps {
  onAddWidget?: (widget: any) => void;
  onToggleWidget?: (widgetId: string) => void;
  className?: string;
}

const WidgetControls: React.FC<WidgetControlsProps> = ({ 
  onAddWidget, 
  onToggleWidget, 
  className 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {onAddWidget && (
        <button
          onClick={() => onAddWidget({ id: 'new-widget', type: 'kpi' })}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Widget
        </button>
      )}
    </div>
  );
};

export default WidgetControls;
