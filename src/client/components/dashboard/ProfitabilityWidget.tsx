import React from 'react';

interface ProfitabilityWidgetProps {
  className?: string;
}

const ProfitabilityWidget: React.FC<ProfitabilityWidgetProps> = ({ className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability</h3>
      <div className="text-gray-500">Profitability widget coming soon...</div>
    </div>
  );
};

export default ProfitabilityWidget;
