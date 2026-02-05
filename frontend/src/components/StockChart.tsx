'use client';

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { type PriceHistory } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface StockChartProps {
  data: PriceHistory;
  symbol: string;
}

export default function StockChart({ data, symbol }: StockChartProps) {
  const chartData = data.data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    close: item.close,
    volume: item.volume,
  }));

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{symbol}</h2>
        <p className="text-sm text-gray-500">Price History - {data.period}</p>
      </div>

      {/* Price Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Price Movement</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #262626',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Close Price']}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorClose)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-4">Trading Volume</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #262626',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Volume']}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fill="#7c3aed" 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
