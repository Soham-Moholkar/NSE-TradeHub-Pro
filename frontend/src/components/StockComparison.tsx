'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitCompare, Plus, X, TrendingUp, TrendingDown, 
  BarChart2, Activity, Target, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Legend, CartesianGrid, Area, ComposedChart
} from 'recharts';
import { pricesAPI, mlAPI } from '../lib/api';

interface ComparisonStock {
  symbol: string;
  name: string;
  data: any[];
  prediction?: any;
  stats?: {
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volatility: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AVAILABLE_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'WIPRO', 'ASIANPAINT', 'BAJFINANCE', 'MARUTI', 'AXISBANK'
];

export default function StockComparison() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['RELIANCE', 'TCS']);
  const [comparisonData, setComparisonData] = useState<ComparisonStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [comparisonMetric, setComparisonMetric] = useState<'price' | 'normalized' | 'volume'>('normalized');

  useEffect(() => {
    if (selectedStocks.length > 0) {
      loadComparisonData();
    }
  }, [selectedStocks]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const stockPromises = selectedStocks.map(async (symbol) => {
        const [priceData, predictionData] = await Promise.all([
          pricesAPI.getHistory(symbol, 30).catch(() => ({ data: { data: [] } })),
          mlAPI.predict(symbol).catch(() => null)
        ]);

        const prices = priceData?.data?.data || [];
        
        // Calculate stats
        let stats = undefined;
        if (prices.length > 0) {
          const currentPrice = prices[prices.length - 1]?.close || 0;
          const prevPrice = prices.length > 1 ? prices[prices.length - 2]?.close : currentPrice;
          const change = currentPrice - prevPrice;
          const changePercent = prevPrice ? (change / prevPrice) * 100 : 0;
          
          const highs = prices.map((p: any) => p.high);
          const lows = prices.map((p: any) => p.low);
          const closes = prices.map((p: any) => p.close);
          
          // Calculate volatility (standard deviation of daily returns)
          const returns = closes.slice(1).map((c: number, i: number) => 
            (c - closes[i]) / closes[i] * 100
          );
          const avgReturn = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
          const variance = returns.reduce((sum: number, r: number) => 
            sum + Math.pow(r - avgReturn, 2), 0
          ) / returns.length;
          const volatility = Math.sqrt(variance);

          stats = {
            currentPrice,
            change,
            changePercent,
            high: Math.max(...highs),
            low: Math.min(...lows),
            volatility
          };
        }

        return {
          symbol,
          name: symbol,
          data: prices,
          prediction: predictionData?.data,
          stats
        };
      });

      const results = await Promise.all(stockPromises);
      setComparisonData(results);
    } catch (error) {
      console.error('Error loading comparison data:', error);
    }
    setLoading(false);
  };

  const addStock = (symbol: string) => {
    if (!selectedStocks.includes(symbol) && selectedStocks.length < 5) {
      setSelectedStocks([...selectedStocks, symbol]);
    }
    setShowAddMenu(false);
  };

  const removeStock = (symbol: string) => {
    if (selectedStocks.length > 1) {
      setSelectedStocks(selectedStocks.filter(s => s !== symbol));
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (comparisonData.length === 0) return [];

    // Find the shortest dataset length
    const minLength = Math.min(...comparisonData.map(s => s.data.length));
    
    // Normalize all prices to percentage change from first day
    const normalizedData: any[] = [];
    
    for (let i = 0; i < minLength; i++) {
      const point: any = {};
      
      comparisonData.forEach((stock, idx) => {
        const firstPrice = stock.data[0]?.close || 1;
        const currentPrice = stock.data[i]?.close || firstPrice;
        
        if (comparisonMetric === 'normalized') {
          point[stock.symbol] = ((currentPrice - firstPrice) / firstPrice) * 100;
        } else if (comparisonMetric === 'price') {
          point[stock.symbol] = currentPrice;
        } else {
          point[stock.symbol] = stock.data[i]?.volume || 0;
        }
        
        if (idx === 0) {
          point.date = stock.data[i]?.date || `Day ${i + 1}`;
        }
      });
      
      normalizedData.push(point);
    }
    
    return normalizedData;
  };

  const chartData = prepareChartData();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6 glass-card">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <GitCompare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Stock Comparison</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Compare up to 5 stocks</p>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          {[
            { id: 'normalized', label: 'Normalized %' },
            { id: 'price', label: 'Price' },
            { id: 'volume', label: 'Volume' }
          ].map((metric) => (
            <button
              key={metric.id}
              onClick={() => setComparisonMetric(metric.id as any)}
              className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                comparisonMetric === metric.id
                  ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Stocks Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {selectedStocks.map((symbol, idx) => (
          <div 
            key={symbol}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: `${COLORS[idx]}20`,
              color: COLORS[idx]
            }}
          >
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[idx] }}
            />
            {symbol}
            {selectedStocks.length > 1 && (
              <button
                onClick={() => removeStock(symbol)}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        
        {/* Add Stock Button */}
        {selectedStocks.length < 5 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
            
            {/* Dropdown Menu */}
            {showAddMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-60 overflow-y-auto">
                {AVAILABLE_STOCKS
                  .filter(s => !selectedStocks.includes(s))
                  .map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => addStock(symbol)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[300px] md:h-[400px] mb-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => {
                  const date = new Date(val);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => 
                  comparisonMetric === 'normalized' 
                    ? `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
                    : comparisonMetric === 'volume'
                      ? `${(val / 1000000).toFixed(1)}M`
                      : `₹${val.toFixed(0)}`
                }
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  comparisonMetric === 'normalized'
                    ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
                    : comparisonMetric === 'volume'
                      ? `${(value / 1000000).toFixed(2)}M`
                      : `₹${value.toFixed(2)}`,
                  name
                ]}
              />
              <Legend />
              {selectedStocks.map((symbol, idx) => (
                <Line
                  key={symbol}
                  type="monotone"
                  dataKey={symbol}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Metric</th>
              {comparisonData.map((stock, idx) => (
                <th key={stock.symbol} className="text-right py-2 px-3 font-medium" style={{ color: COLORS[idx] }}>
                  {stock.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Current Price</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className="text-right py-2 px-3 font-medium text-gray-800 dark:text-white">
                  ₹{stock.stats?.currentPrice.toFixed(2) || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Change</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className={`text-right py-2 px-3 font-medium ${
                  (stock.stats?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stock.stats?.change !== undefined 
                    ? `${stock.stats.change >= 0 ? '+' : ''}${stock.stats.change.toFixed(2)} (${stock.stats.changePercent.toFixed(2)}%)`
                    : '-'
                  }
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30D High</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className="text-right py-2 px-3 text-gray-800 dark:text-white">
                  ₹{stock.stats?.high.toFixed(2) || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">30D Low</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className="text-right py-2 px-3 text-gray-800 dark:text-white">
                  ₹{stock.stats?.low.toFixed(2) || '-'}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700/50">
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Volatility</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className="text-right py-2 px-3 text-gray-800 dark:text-white">
                  {stock.stats?.volatility.toFixed(2)}%
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400">AI Prediction</td>
              {comparisonData.map((stock) => (
                <td key={stock.symbol} className="text-right py-2 px-3">
                  {stock.prediction?.prediction ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      stock.prediction.prediction === 'UP'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {stock.prediction.prediction === 'UP' 
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />
                      }
                      {stock.prediction.prediction}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
