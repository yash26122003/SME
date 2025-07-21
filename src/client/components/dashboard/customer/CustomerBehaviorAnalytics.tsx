import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Scatter, Bar, Doughnut } from 'react-chartjs-2';
import { useAnalyticsStore, CustomerAnalytics } from '../../../stores/analyticsStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CustomerBehaviorAnalyticsProps {
  className?: string;
}

const CustomerBehaviorAnalytics: React.FC<CustomerBehaviorAnalyticsProps> = ({ className = '' }) => {
  const {
    customerAnalytics,
    isLoading,
    error,
    dashboardConfig,
  } = useAnalyticsStore();

  const [selectedView, setSelectedView] = useState<'clv' | 'churn' | 'segments'>('clv');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'clv' | 'churn' | 'purchases'>('clv');

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: dashboardConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customerAnalytics;
    
    if (riskFilter !== 'all') {
      filtered = filtered.filter(customer => customer.risk_level === riskFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'clv':
          return b.clv_prediction - a.clv_prediction;
        case 'churn':
          return b.churn_probability - a.churn_probability;
        case 'purchases':
          return b.total_purchases - a.total_purchases;
        default:
          return 0;
      }
    });
  }, [customerAnalytics, riskFilter, sortBy]);

  // CLV vs Churn scatter plot data
  const scatterData = useMemo(() => {
    if (!customerAnalytics.length) return null;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'high': return 'rgba(239, 68, 68, 0.8)';
        case 'medium': return 'rgba(245, 158, 11, 0.8)';
        case 'low': return 'rgba(34, 197, 94, 0.8)';
        default: return 'rgba(107, 114, 128, 0.8)';
      }
    };

    return {
      datasets: [
        {
          label: 'High Risk',
          data: customerAnalytics
            .filter(c => c.risk_level === 'high')
            .map(c => ({
              x: c.churn_probability * 100,
              y: c.clv_prediction,
              customer_id: c.customer_id,
              segment: c.segment,
            })),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          pointRadius: 6,
        },
        {
          label: 'Medium Risk',
          data: customerAnalytics
            .filter(c => c.risk_level === 'medium')
            .map(c => ({
              x: c.churn_probability * 100,
              y: c.clv_prediction,
              customer_id: c.customer_id,
              segment: c.segment,
            })),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          pointRadius: 6,
        },
        {
          label: 'Low Risk',
          data: customerAnalytics
            .filter(c => c.risk_level === 'low')
            .map(c => ({
              x: c.churn_probability * 100,
              y: c.clv_prediction,
              customer_id: c.customer_id,
              segment: c.segment,
            })),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          pointRadius: 6,
        },
      ],
    };
  }, [customerAnalytics]);

  // Customer segments distribution
  const segmentData = useMemo(() => {
    if (!customerAnalytics.length) return null;

    const segments = customerAnalytics.reduce((acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(segments),
      datasets: [
        {
          data: Object.values(segments),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [customerAnalytics]);

  // CLV distribution by segment
  const clvBySegmentData = useMemo(() => {
    if (!customerAnalytics.length) return null;

    const segmentCLV = customerAnalytics.reduce((acc, customer) => {
      if (!acc[customer.segment]) {
        acc[customer.segment] = [];
      }
      acc[customer.segment].push(customer.clv_prediction);
      return acc;
    }, {} as Record<string, number[]>);

    const segments = Object.keys(segmentCLV);
    const avgCLV = segments.map(segment => 
      segmentCLV[segment].reduce((sum, clv) => sum + clv, 0) / segmentCLV[segment].length
    );

    return {
      labels: segments,
      datasets: [
        {
          label: 'Average CLV',
          data: avgCLV,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [customerAnalytics]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!customerAnalytics.length) return null;

    const totalCustomers = customerAnalytics.length;
    const avgCLV = customerAnalytics.reduce((sum, c) => sum + c.clv_prediction, 0) / totalCustomers;
    const avgChurnRisk = customerAnalytics.reduce((sum, c) => sum + c.churn_probability, 0) / totalCustomers;
    const highRiskCustomers = customerAnalytics.filter(c => c.risk_level === 'high').length;
    const atRiskRevenue = customerAnalytics
      .filter(c => c.risk_level === 'high')
      .reduce((sum, c) => sum + c.clv_prediction, 0);

    return {
      totalCustomers,
      avgCLV,
      avgChurnRisk,
      highRiskCustomers,
      atRiskRevenue,
      churnRate: (avgChurnRisk * 100).toFixed(1),
    };
  }, [customerAnalytics]);

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Customer Lifetime Value vs Churn Risk',
        font: { size: 16, weight: 'bold' as const },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = context.raw;
            return [
              `Customer: ${point.customer_id}`,
              `Segment: ${point.segment}`,
              `CLV: ${formatCurrency(point.y)}`,
              `Churn Risk: ${point.x.toFixed(1)}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Churn Probability (%)',
        },
      },
      y: {
        title: {
          display: true,
          text: `Customer Lifetime Value (${dashboardConfig.currency})`,
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <p>Error loading customer analytics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Customer Behavior Analytics</h3>
        
        <div className="flex flex-wrap gap-4">
          {/* View Selection */}
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as 'clv' | 'churn' | 'segments')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="clv">CLV Analysis</option>
            <option value="churn">Churn Analysis</option>
            <option value="segments">Customer Segments</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'clv' | 'churn' | 'purchases')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="clv">Sort by CLV</option>
            <option value="churn">Sort by Churn Risk</option>
            <option value="purchases">Sort by Purchases</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Total Customers</div>
            <div className="text-2xl font-bold text-blue-900">
              {summaryMetrics.totalCustomers.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Avg CLV</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(summaryMetrics.avgCLV)}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-600">Churn Rate</div>
            <div className="text-2xl font-bold text-yellow-900">
              {summaryMetrics.churnRate}%
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600">High Risk</div>
            <div className="text-2xl font-bold text-red-900">
              {summaryMetrics.highRiskCustomers}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">At-Risk Revenue</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(summaryMetrics.atRiskRevenue)}
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="mb-6">
        {selectedView === 'clv' && scatterData && (
          <div className="h-96">
            <Scatter data={scatterData} options={scatterOptions} />
          </div>
        )}

        {selectedView === 'segments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {segmentData && (
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-900 mb-4">Customer Distribution by Segment</h4>
                <Doughnut 
                  data={segmentData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }} 
                />
              </div>
            )}
            
            {clvBySegmentData && (
              <div className="h-80">
                <h4 className="text-md font-medium text-gray-900 mb-4">Average CLV by Segment</h4>
                <Bar 
                  data={clvBySegmentData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        ticks: {
                          callback: function(value: any) {
                            return formatCurrency(value);
                          },
                        },
                      },
                    },
                  }} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer List */}
      {filteredCustomers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Customer Details ({filteredCustomers.length} customers)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CLV Prediction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Churn Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Purchases
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Order Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.slice(0, 10).map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.segment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.clv_prediction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(customer.churn_probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                        customer.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {customer.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_purchases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.avg_order_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length > 10 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Showing top 10 of {filteredCustomers.length} customers
              </p>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {summaryMetrics && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {summaryMetrics.highRiskCustomers} customers ({((summaryMetrics.highRiskCustomers / summaryMetrics.totalCustomers) * 100).toFixed(1)}%) are at high churn risk</li>
            <li>• At-risk revenue of {formatCurrency(summaryMetrics.atRiskRevenue)} needs retention focus</li>
            <li>• Average customer lifetime value is {formatCurrency(summaryMetrics.avgCLV)}</li>
            <li>• Overall churn rate is {summaryMetrics.churnRate}% - monitor closely</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomerBehaviorAnalytics;
