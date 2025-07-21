import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface Insight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: 'trend' | 'anomaly' | 'recommendation';
  timestamp: Date;
}

interface InsightsPanelProps {
  insights?: Insight[];
  className?: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  insights = [], 
  className 
}) => {
  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'anomaly':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'recommendation':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
      {insights.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No insights available</div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className={`p-3 border rounded-lg ${getInsightColor(insight.type)}`}>
              <div className="flex items-start space-x-3">
                <LightBulbIcon className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{insight.title}</div>
                  <div className="text-sm mt-1">{insight.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs capitalize">{insight.type}</div>
                    <div className="text-xs">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
