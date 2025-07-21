import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  unit?: string;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  unit = '', 
  className 
}) => {
  const changeColor = change && change > 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">
        {value}{unit}
      </div>
      {change !== undefined && (
        <div className={`text-sm ${changeColor} mt-1`}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  );
};

export default KPICard;
