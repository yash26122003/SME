import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface QueryResult {
  success: boolean;
  query: string;
  interpretation: string;
  sqlQuery: string;
  data: any[];
  insights: string[];
  visualizationType: string;
  executionTime: number;
  error?: string;
}

const RealNLPQueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [quickQueries] = useState([
    "Which store has the highest sales?",
    "Show me sales trends by month",
    "What's the impact of holidays on sales?",
    "Compare sales between 2010 and 2011",
    "Which factors affect sales the most?",
    "Show me the worst performing stores",
    "What's the average temperature when sales are highest?",
    "How does fuel price correlate with sales?"
  ]);

  useEffect(() => {
    loadDataSummary();
  }, []);

  const loadDataSummary = async () => {
    try {
      const response = await fetch('/api/v1/real-analytics/data-summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const summary = await response.json();
        setDataSummary(summary);
      }
    } catch (error) {
      console.error('Error loading data summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/real-analytics/nlp-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error processing query:', error);
      setResult({
        success: false,
        query,
        interpretation: 'Network error occurred',
        sqlQuery: '',
        data: [],
        insights: ['Failed to connect to the server. Please try again.'],
        visualizationType: 'error',
        executionTime: 0,
        error: 'Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
  };

  const renderVisualization = () => {
    if (!result || !result.success || !result.data.length) {
      return null;
    }

    const { data, visualizationType } = result;

    // Prepare chart data based on the result
    if (visualizationType === 'line' || visualizationType === 'bar') {
      // Find appropriate columns for X and Y axis
      const firstRow = data[0];
      const columns = Object.keys(firstRow);
      
      // Try to find date/time column
      const dateColumn = columns.find(col => 
        col.includes('date') || col.includes('period') || col.includes('month') || col.includes('time')
      );
      
      // Try to find sales/numeric column
      const salesColumn = columns.find(col => 
        col.includes('sales') || col.includes('total') || col.includes('avg') || col.includes('sum')
      );

      if (dateColumn && salesColumn) {
        const chartData = {
          labels: data.map(row => {
            const dateVal = row[dateColumn];
            if (dateVal instanceof Date) {
              return dateVal.toLocaleDateString();
            }
            return String(dateVal).substring(0, 10); // Truncate timestamp
          }),
          datasets: [{
            label: salesColumn.replace(/_/g, ' ').toUpperCase(),
            data: data.map(row => parseFloat(row[salesColumn]) || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: visualizationType === 'bar' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.1)',
            tension: 0.1
          }]
        };

        const chartOptions = {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: result.interpretation
            },
            legend: {
              position: 'top' as const,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  if (salesColumn.includes('sales') || salesColumn.includes('revenue')) {
                    return '$' + value.toLocaleString();
                  }
                  return value.toLocaleString();
                }
              }
            }
          }
        };

        const ChartComponent = visualizationType === 'bar' ? Bar : Line;
        return (
          <div className="mt-6 h-96">
            <ChartComponent data={chartData} options={chartOptions} />
          </div>
        );
      }
    }

    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Real Walmart Sales Analytics
        </h1>
        <p className="text-gray-600">
          Ask questions about Walmart sales data in plain English. Powered by Gemini AI.
        </p>
        
        {dataSummary && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Records</div>
              <div className="text-2xl font-bold text-blue-900">
                {parseInt(dataSummary.total_records).toLocaleString()}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Sales</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(parseFloat(dataSummary.total_sales))}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Stores</div>
              <div className="text-2xl font-bold text-purple-900">
                {dataSummary.unique_stores}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Date Range</div>
              <div className="text-sm font-bold text-orange-900">
                {dataSummary.earliest_date?.substring(0, 10)} to {dataSummary.latest_date?.substring(0, 10)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Query Input Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about Walmart sales data... e.g., 'Which store performs best during holidays?'"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              'Ask Question'
            )}
          </button>
        </div>
      </form>

      {/* Quick Query Buttons */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Try these questions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickQueries.map((quickQuery, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuery(quickQuery)}
              className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {quickQuery}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Query Interpretation */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Understanding your question:</h3>
            <p className="text-gray-700 bg-blue-50 p-3 rounded-lg mt-2">
              {result.interpretation}
            </p>
          </div>

          {/* SQL Query */}
          {result.sqlQuery && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Generated SQL Query:</h4>
              <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-sm overflow-x-auto">
                {result.sqlQuery}
              </pre>
            </div>
          )}

          {/* Visualization */}
          {renderVisualization()}

          {/* Data Table */}
          {result.success && result.data.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Results ({result.data.length} rows):</h4>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {Object.keys(result.data[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.data.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof value === 'number' && Object.keys(row)[cellIndex].includes('sales') 
                              ? formatCurrency(value)
                              : typeof value === 'number' 
                              ? value.toLocaleString()
                              : String(value).substring(0, 50)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.data.length > 10 && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Showing first 10 of {result.data.length} results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights */}
          {result.insights.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">AI Insights:</h4>
              <ul className="space-y-2">
                {result.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Execution Stats */}
          <div className="mt-4 text-sm text-gray-500 flex justify-between">
            <span>Executed in {result.executionTime}ms</span>
            <span className={`px-2 py-1 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.success ? 'Success' : 'Error'}
            </span>
          </div>

          {/* Error Display */}
          {!result.success && result.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <strong>Error:</strong> {result.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealNLPQueryInterface;
