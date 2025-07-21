import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface DashboardHeaderProps {
  title: string;
  onSettingsClick?: () => void;
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  onSettingsClick, 
  className 
}) => {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default DashboardHeader;
