import React from 'react';

interface CashFlowWidgetProps {
  className?: string;
}

const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow</h3>
      <div className="text-gray-500">Cash flow widget coming soon...</div>
    </div>
  );
};

export default CashFlowWidget;
