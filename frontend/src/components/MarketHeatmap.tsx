'use client';

import { useEffect, useState } from 'react';
import { symbolsAPI, pricesAPI } from '@/lib/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeatmapStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketHeatmapProps {
  onSymbolClick?: (symbol: string) => void;
}

export default function MarketHeatmap({ onSymbolClick }: MarketHeatmapProps = {}) {
  const [stocks, setStocks] = useState<HeatmapStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    try {
      const response = await symbolsAPI.getPopular();
      const popularStocks = response.data.symbols.slice(0, 12);

      const heatmapData = await Promise.all(
        popularStocks.map(async (stock: any) => {
          try {
            const priceResponse = await pricesAPI.getHistory(stock.symbol, 5);
            const prices = priceResponse.data.data;
            
            if (prices.length >= 2) {
              const latest = prices[prices.length - 1];
              const previous = prices[prices.length - 2];
              const change = latest.close - previous.close;
              const changePercent = (change / previous.close) * 100;

              return {
                symbol: stock.symbol,
                name: stock.company_name,
                price: latest.close,
                change,
                changePercent,
              };
            }
            return null;
          } catch (err) {
            return null;
          }
        })
      );

      setStocks(heatmapData.filter((s: any): s is HeatmapStock => s !== null));
    } catch (err) {
      console.error('Failed to load heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (changePercent: number) => {
    if (changePercent > 2) return 'bg-green-600 hover:bg-green-700';
    if (changePercent > 0) return 'bg-green-500/70 hover:bg-green-500';
    if (changePercent > -2) return 'bg-red-500/70 hover:bg-red-500';
    return 'bg-red-600 hover:bg-red-700';
  };

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Market Heatmap</h3>
        <div className="animate-pulse grid grid-cols-3 md:grid-cols-4 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Market Heatmap</h3>
        <button
          onClick={loadHeatmapData}
          className="text-sm text-blue-500 hover:text-blue-400"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className={`${getColorClass(stock.changePercent)} text-white p-3 rounded-lg transition-colors cursor-pointer`}
            title={stock.name}
            onClick={() => onSymbolClick?.(stock.symbol)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">{stock.symbol}</span>
              {stock.change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
            </div>
            <div className="text-sm font-semibold">₹{stock.price.toFixed(2)}</div>
            <div className="text-xs font-medium">
              {stock.changePercent > 0 ? '+' : ''}
              {stock.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span className="text-gray-500">Strong Gain</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500/70 rounded"></div>
          <span className="text-gray-500">Gain</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500/70 rounded"></div>
          <span className="text-gray-500">Loss</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span className="text-gray-500">Strong Loss</span>
        </div>
      </div>
    </div>
  );
}
