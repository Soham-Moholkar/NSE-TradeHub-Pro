'use client';

import { useState, useEffect } from 'react';
import { watchlistAPI, type WatchlistItem as WatchlistItemType } from '@/lib/api';
import { Star, Trash2, Plus } from 'lucide-react';

interface WatchlistProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function Watchlist({ currentSymbol, onSelectSymbol }: WatchlistProps) {
  const [items, setItems] = useState<WatchlistItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    setIsInWatchlist(items.some(item => item.symbol === currentSymbol));
  }, [items, currentSymbol]);

  const loadWatchlist = async () => {
    try {
      const response = await watchlistAPI.getAll();
      setItems(response.data);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!currentSymbol) return;

    setLoading(true);
    try {
      await watchlistAPI.add(currentSymbol);
      await loadWatchlist();
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    setLoading(true);
    try {
      await watchlistAPI.remove(symbol);
      await loadWatchlist();
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Star className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Watchlist</h3>
        </div>
        
        {!isInWatchlist && currentSymbol && (
          <button
            onClick={handleAddToWatchlist}
            disabled={loading}
            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Add to watchlist"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No stocks in watchlist</p>
            <p className="text-xs mt-1">Add stocks to track them</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-all ${
                item.symbol === currentSymbol
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[#262626] hover:border-[#404040] hover:bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onSelectSymbol(item.symbol)}
                  className="flex-1 text-left"
                >
                  <div className="font-semibold text-white">{item.symbol}</div>
                  <div className="text-xs text-gray-500">{item.company_name}</div>
                  {item.current_price && (
                    <div className="mt-1 flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-300">₹{item.current_price.toFixed(2)}</span>
                      {item.change_percent !== null && item.change_percent !== undefined && (
                        <span
                          className={`text-xs font-medium ${
                            item.change_percent >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {item.change_percent >= 0 ? '+' : ''}
                          {item.change_percent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => handleRemoveFromWatchlist(item.symbol)}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from watchlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
