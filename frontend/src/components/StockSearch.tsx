'use client';

import { useState, useEffect, useRef } from 'react';
import { symbolsAPI, type Symbol } from '@/lib/api';
import { Search } from 'lucide-react';

interface StockSearchProps {
  onSelectSymbol: (symbol: string) => void;
}

export default function StockSearch({ onSelectSymbol }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Symbol[]>([]);
  const [popularStocks, setPopularStocks] = useState<Symbol[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load popular stocks on mount
    loadPopularStocks();

    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPopularStocks = async () => {
    try {
      const response = await symbolsAPI.getPopular();
      setPopularStocks(response.data.symbols);
    } catch (err) {
      console.error('Failed to load popular stocks:', err);
    }
  };

  const handleSearch = async (value: string) => {
    setQuery(value);

    if (value.length < 1) {
      setResults([]);
      return;
    }

    try {
      const response = await symbolsAPI.search(value);
      setResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setQuery('');
    setShowResults(false);
    onSelectSymbol(symbol);
  };

  const displayResults = query.length > 0 ? results : popularStocks;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search NSE stocks (e.g., RELIANCE, TCS, HDFC)..."
          className="w-full pl-12 pr-4 py-3 text-lg bg-[#0d0d0d] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {showResults && displayResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-[#121212] rounded-lg border border-[#262626] max-h-96 overflow-y-auto">
          <div className="p-2">
            {query.length === 0 && (
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Popular Stocks
              </div>
            )}
            {displayResults.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelectSymbol(stock.symbol)}
                className="w-full px-3 py-3 text-left hover:bg-[#1a1a1a] rounded-md transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-400">
                    {stock.symbol}
                  </div>
                  <div className="text-sm text-gray-500">{stock.company_name}</div>
                </div>
                {stock.sector && (
                  <div className="text-xs bg-[#1a1a1a] text-gray-400 px-2 py-1 rounded group-hover:bg-blue-500/20 group-hover:text-blue-400">
                    {stock.sector}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
