import React from 'react';

interface CustomerAnalyticsWidgetProps {
  className?: string;
}

const CustomerAnalyticsWidget: React.FC<CustomerAnalyticsWidgetProps> = ({ className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Analytics</h3>
      <div className="text-gray-500">Customer analytics widget coming soon...</div>
    </div>
  );
};

export default CustomerAnalyticsWidget;
