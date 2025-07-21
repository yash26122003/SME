import React from 'react';

interface SalesForecastingWidgetProps {
  className?: string;
}

const SalesForecastingWidget: React.FC<SalesForecastingWidgetProps> = ({ className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Forecasting</h3>
      <div className="text-gray-500">Sales forecasting widget coming soon...</div>
    </div>
  );
};

export default SalesForecastingWidget;
