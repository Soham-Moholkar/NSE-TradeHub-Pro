'use client';

import { useState, useEffect } from 'react';
import { pricesAPI } from '@/lib/api';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface StockSidebarProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

interface StockMiniData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

const SIDEBAR_STOCKS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'HINDUNILVR',
  'SBIN',
  'BHARTIARTL',
  'KOTAKBANK',
  'ITC',
];

export default function StockSidebar({ selectedSymbol, onSelectSymbol }: StockSidebarProps) {
  const [stocks, setStocks] = useState<StockMiniData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStocksData();
  }, []);

  const loadStocksData = async () => {
    setLoading(true);
    const stocksData: StockMiniData[] = [];

    // Load stocks in parallel for better performance
    const promises = SIDEBAR_STOCKS.map(async (symbol) => {
      try {
        const response = await pricesAPI.getHistory(symbol, 30);
        const data = response.data.data;
        
        if (data && data.length > 1) {
          const latestPrice = data[data.length - 1].close;
          const previousPrice = data[data.length - 2].close;
          const change = latestPrice - previousPrice;
          const changePercent = (change / previousPrice) * 100;
          const sparkline = data.slice(-20).map((d: any) => d.close);
          
          return {
            symbol,
            price: latestPrice,
            change,
            changePercent,
            sparkline,
          };
        }
      } catch (err) {
        console.log(`Failed to load ${symbol}`);
      }
      return {
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        sparkline: [],
      };
    });

    const results = await Promise.all(promises);
    setStocks(results.filter(s => s.price > 0));
    setLoading(false);
  };

  const MiniSparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
    if (!data || data.length < 2) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 24;
    const width = 60;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={positive ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 w-56">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Top Stocks</h3>
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-14 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 w-56 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Top Stocks</h3>
        <button 
          onClick={loadStocksData}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
      
      <div className="space-y-1.5">
        {stocks.map((stock) => {
          const isPositive = stock.change >= 0;
          const isSelected = stock.symbol === selectedSymbol;
          
          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectSymbol(stock.symbol)}
              className={`w-full p-2 rounded-lg transition-all duration-200 text-left ${
                isSelected 
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {stock.symbol}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-gray-700">
                      ₹{stock.price.toFixed(0)}
                    </span>
                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <MiniSparkline data={stock.sparkline} positive={isPositive} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
