import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAnalyticsStore, FinancialMetrics } from '../../../stores/analyticsStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FinancialHealthIndicatorsProps {
  className?: string;
}

const FinancialHealthIndicators: React.FC<FinancialHealthIndicatorsProps> = ({ className = '' }) => {
  const {
    financialMetrics,
    isLoading,
    error,
    dashboardConfig,
  } = useAnalyticsStore();

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: dashboardConfig.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: dashboardConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!financialMetrics.length) return null;

    const totalMonths = financialMetrics.length;
    const avgCashFlow = financialMetrics.reduce((sum, m) => sum + m.cash_flow, 0) / totalMonths;
    const totalRevenue = financialMetrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = financialMetrics.reduce((sum, m) => sum + m.expenses, 0);
    const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue) * 100;
    const avgBudgetVariance = financialMetrics.reduce((sum, m) => sum + m.budget_variance, 0) / totalMonths;

    return {
      avgCashFlow,
      totalRevenue,
      totalExpenses,
      profitMargin: profitMargin.toFixed(1),
      avgBudgetVariance,
    };
  }, [financialMetrics]);

  const barData = {
    labels: financialMetrics.map((m) => m.date),
    datasets: [
      {
        label: 'Revenue',
        data: financialMetrics.map((m) => m.revenue),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
      },
      {
        label: 'Expenses',
        data: financialMetrics.map((m) => m.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
      },
      {
        label: 'Cash Flow',
        data: financialMetrics.map((m) => m.cash_flow),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Health Overview',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || '';
            if (context.parsed.y !== null) {
              return label + ': ' + formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Amount (' + dashboardConfig.currency + ')',
        },
        ticks: {
          callback: function (value: any) {
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
          <p>Error loading financial metrics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Health Indicators</h3>

      {/* Summary Metrics */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Average Cash Flow</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(summaryMetrics.avgCashFlow)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Total Revenue</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(summaryMetrics.totalRevenue)}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(summaryMetrics.totalExpenses)}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Profit Margin</div>
            <div className="text-2xl font-bold text-purple-900">
              {summaryMetrics.profitMargin}%
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-600">Avg Budget Variance</div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(summaryMetrics.avgBudgetVariance)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-96 mb-6">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Profit margin is currently at {summaryMetrics?.profitMargin}%.</li>
          <li>• Total revenue is {formatCurrency(summaryMetrics?.totalRevenue)}.</li>
          <li>• Total expenses amount to {formatCurrency(summaryMetrics?.totalExpenses)}.</li>
          <li>• Monitor budget variance for optimization opportunities.</li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialHealthIndicators;
