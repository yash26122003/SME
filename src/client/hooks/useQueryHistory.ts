/**
 * useQueryHistory Hook
 * Manages user's query history with local storage and server synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { NLQuery, QueryHistory } from '@shared/types/query';
import { APIResponse } from '@shared/types';

interface UseQueryHistoryReturn {
  history: QueryHistory | null;
  isLoading: boolean;
  error: string | null;
  addToHistory: (query: NLQuery) => void;
  removeFromHistory: (queryId: string) => void;
  toggleFavorite: (queryId: string) => void;
  clearHistory: () => void;
  refreshHistory: () => Promise<void>;
}

const STORAGE_KEY = 'query_history';
const MAX_LOCAL_HISTORY = 100;

export function useQueryHistory(): UseQueryHistoryReturn {
  const [history, setHistory] = useState<QueryHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from server on mount
  useEffect(() => {
    loadHistoryFromServer();
  }, []);

  // Load history from server
  const loadHistoryFromServer = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/queries/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const result: APIResponse<QueryHistory> = await response.json();

      if (result.success && result.data) {
        setHistory(result.data);
        // Also save to local storage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      } else {
        // Fallback to local storage
        loadHistoryFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading history from server:', error);
      // Fallback to local storage
      loadHistoryFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load history from local storage
  const loadHistoryFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedHistory: QueryHistory = JSON.parse(stored);
        setHistory(parsedHistory);
      } else {
        // Initialize empty history
        const emptyHistory: QueryHistory = {
          userId: '',
          tenantId: '',
          queries: [],
          totalQueries: 0,
          favoriteQueries: [],
          recentSearches: [],
          queryFrequency: []
        };
        setHistory(emptyHistory);
      }
    } catch (error) {
      console.error('Error loading history from local storage:', error);
      setError('Failed to load query history');
    }
  }, []);

  // Save history to local storage
  const saveHistoryToLocalStorage = useCallback((updatedHistory: QueryHistory) => {
    try {
      // Limit local storage size
      const limitedHistory = {
        ...updatedHistory,
        queries: updatedHistory.queries.slice(0, MAX_LOCAL_HISTORY)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving history to local storage:', error);
    }
  }, []);

  // Add query to history
  const addToHistory = useCallback((query: NLQuery) => {
    if (!history) return;

    const newHistoryEntry = {
      queryId: query.id,
      query: query.rawQuery,
      timestamp: query.createdAt,
      executionTime: query.processingTime,
      resultCount: query.results?.length || 0,
      isFavorite: false,
      tags: extractTagsFromQuery(query.rawQuery)
    };

    const updatedHistory: QueryHistory = {
      ...history,
      queries: [newHistoryEntry, ...history.queries],
      totalQueries: history.totalQueries + 1,
      recentSearches: updateRecentSearches(history.recentSearches, query.rawQuery),
      queryFrequency: updateQueryFrequency(history.queryFrequency, query.rawQuery, query.processingTime)
    };

    setHistory(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);

    // Optionally sync to server in the background
    syncToServer(updatedHistory);
  }, [history, saveHistoryToLocalStorage]);

  // Remove query from history
  const removeFromHistory = useCallback((queryId: string) => {
    if (!history) return;

    const updatedHistory: QueryHistory = {
      ...history,
      queries: history.queries.filter(q => q.queryId !== queryId),
      totalQueries: Math.max(0, history.totalQueries - 1),
      favoriteQueries: history.favoriteQueries.filter(id => id !== queryId)
    };

    setHistory(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
    syncToServer(updatedHistory);
  }, [history, saveHistoryToLocalStorage]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (queryId: string) => {
    if (!history) return;

    const isFavorite = history.favoriteQueries.includes(queryId);
    
    try {
      // Update server first
      const response = await fetch(`/api/queries/${queryId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        const updatedHistory: QueryHistory = {
          ...history,
          favoriteQueries: isFavorite 
            ? history.favoriteQueries.filter(id => id !== queryId)
            : [...history.favoriteQueries, queryId],
          queries: history.queries.map(q => 
            q.queryId === queryId 
              ? { ...q, isFavorite: !isFavorite }
              : q
          )
        };

        setHistory(updatedHistory);
        saveHistoryToLocalStorage(updatedHistory);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite status');
    }
  }, [history, saveHistoryToLocalStorage]);

  // Clear all history
  const clearHistory = useCallback(() => {
    const emptyHistory: QueryHistory = {
      userId: history?.userId || '',
      tenantId: history?.tenantId || '',
      queries: [],
      totalQueries: 0,
      favoriteQueries: [],
      recentSearches: [],
      queryFrequency: []
    };

    setHistory(emptyHistory);
    localStorage.removeItem(STORAGE_KEY);
    syncToServer(emptyHistory);
  }, [history]);

  // Refresh history from server
  const refreshHistory = useCallback(async () => {
    await loadHistoryFromServer();
  }, [loadHistoryFromServer]);

  // Sync to server (background operation)
  const syncToServer = useCallback(async (historyData: QueryHistory) => {
    try {
      // This would be implemented based on your API design
      // For now, we'll just log it
      console.log('Syncing history to server:', historyData);
    } catch (error) {
      console.error('Error syncing history to server:', error);
    }
  }, []);

  // Helper functions
  const extractTagsFromQuery = (query: string): string[] => {
    const commonTags = [
      { keyword: 'sales', tag: 'sales' },
      { keyword: 'revenue', tag: 'revenue' },
      { keyword: 'customer', tag: 'customers' },
      { keyword: 'product', tag: 'products' },
      { keyword: 'trend', tag: 'trends' },
      { keyword: 'compare', tag: 'comparison' },
      { keyword: 'performance', tag: 'performance' },
      { keyword: 'growth', tag: 'growth' },
      { keyword: 'forecast', tag: 'forecasting' }
    ];

    const tags: string[] = [];
    const lowerQuery = query.toLowerCase();

    commonTags.forEach(({ keyword, tag }) => {
      if (lowerQuery.includes(keyword)) {
        tags.push(tag);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  };

  const updateRecentSearches = (recentSearches: string[], newQuery: string): string[] => {
    const updated = [newQuery, ...recentSearches.filter(q => q !== newQuery)];
    return updated.slice(0, 10); // Keep only last 10 searches
  };

  const updateQueryFrequency = (
    queryFrequency: any[],
    query: string,
    executionTime: number
  ): any[] => {
    const existing = queryFrequency.find(q => q.query === query);
    
    if (existing) {
      return queryFrequency.map(q => 
        q.query === query
          ? {
              ...q,
              count: q.count + 1,
              lastUsed: new Date(),
              avgExecutionTime: Math.round((q.avgExecutionTime + executionTime) / 2)
            }
          : q
      );
    } else {
      return [
        ...queryFrequency,
        {
          query,
          count: 1,
          lastUsed: new Date(),
          avgExecutionTime: executionTime
        }
      ].slice(0, 50); // Keep only top 50 most frequent queries
    }
  };

  return {
    history,
    isLoading,
    error,
    addToHistory,
    removeFromHistory,
    toggleFavorite,
    clearHistory,
    refreshHistory
  };
}
