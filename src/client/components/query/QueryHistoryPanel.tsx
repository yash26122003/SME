/**
 * Query History Panel Component
 * Displays user's query history with search and favorites
 */

import React, { useState } from 'react';
import { NLQuery, QueryHistory } from '@shared/types/query';
import { XMarkIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface QueryHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onQuerySelect: (query: NLQuery) => void;
  history: QueryHistory | null;
  onToggleFavorite: (queryId: string) => void;
}

export const QueryHistoryPanel: React.FC<QueryHistoryPanelProps> = ({
  isOpen,
  onClose,
  onQuerySelect,
  history,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');

  if (!isOpen || !history) return null;

  // Filter queries based on search term
  const filteredQueries = history.queries.filter(query =>
    query.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get queries based on active tab
  const displayQueries = activeTab === 'favorites'
    ? filteredQueries.filter(query => query.isFavorite)
    : filteredQueries;

  const handleQueryClick = (historyEntry: any) => {
    // Create a mock NLQuery object from history entry
    const mockQuery: NLQuery = {
      id: historyEntry.queryId,
      tenantId: '',
      userId: '',
      rawQuery: historyEntry.query,
      status: 'COMPLETED' as any,
      confidence: 0.8,
      processingTime: historyEntry.executionTime,
      createdAt: historyEntry.timestamp,
      updatedAt: historyEntry.timestamp
    };
    
    onQuerySelect(mockQuery);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'recent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClockIcon className="h-4 w-4 inline mr-2" />
            Recent
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'favorites'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HeartIcon className="h-4 w-4 inline mr-2" />
            Favorites
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {displayQueries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                {activeTab === 'favorites' ? (
                  <HeartIcon className="h-12 w-12 mx-auto text-gray-300" />
                ) : (
                  <ClockIcon className="h-12 w-12 mx-auto text-gray-300" />
                )}
              </div>
              <p>
                {searchTerm
                  ? 'No queries found matching your search'
                  : activeTab === 'favorites'
                  ? 'No favorite queries yet'
                  : 'No recent queries yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayQueries.map((query) => (
                <div
                  key={query.queryId}
                  className="p-4 hover:bg-gray-50 cursor-pointer group"
                  onClick={() => handleQueryClick(query)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate group-hover:text-blue-600">
                        {query.query}
                      </p>
                      <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                        <span>
                          {new Date(query.timestamp).toLocaleDateString()}
                        </span>
                        <span>{query.executionTime}ms</span>
                        <span>{query.resultCount} results</span>
                      </div>
                      {query.tags && query.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {query.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {query.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{query.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(query.queryId);
                      }}
                      className="ml-3 p-1 hover:bg-white rounded-lg transition-colors"
                    >
                      {query.isFavorite ? (
                        <HeartIconSolid className="h-4 w-4 text-red-500" />
                      ) : (
                        <HeartIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total queries: {history.totalQueries}</span>
            <span>Favorites: {history.favoriteQueries.length}</span>
          </div>
        </div>
      </div>
    </>
  );
};
