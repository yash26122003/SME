import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

interface AlertsPanelProps {
  alerts?: Alert[];
  className?: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  alerts = [], 
  className 
}) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
      {alerts.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No alerts</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                <div className="text-sm text-gray-600">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {alert.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
