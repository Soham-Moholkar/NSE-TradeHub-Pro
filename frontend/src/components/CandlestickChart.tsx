'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

interface CandlestickChartProps {
  data: any;
  symbol: string;
}

export default function CandlestickChart({ data, symbol }: CandlestickChartProps) {
  const candleData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];

    return data.data.slice(-60).map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
      isGreen: d.close >= d.open,
      body: Math.abs(d.close - d.open),
      bodyStart: Math.min(d.open, d.close),
      wickHigh: d.high,
      wickLow: d.low,
    }));
  }, [data]);

  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    const isGreen = payload.isGreen;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    const bodyHeight = Math.abs(payload.close - payload.open) * height / (payload.high - payload.low);
    const bodyY = y + (payload.high - Math.max(payload.open, payload.close)) * height / (payload.high - payload.low);
    
    const wickX = x + width / 2;
    const highY = y;
    const lowY = y + height;

    return (
      <g>
        {/* Wick */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x}
          y={bodyY}
          width={width}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  if (candleData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {symbol} - Candlestick Chart (Last 60 Days)
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Bullish</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Bearish</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={candleData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            interval={Math.floor(candleData.length / 10)}
          />
          <YAxis 
            yAxisId="price"
            orientation="right"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <YAxis 
            yAxisId="volume"
            orientation="left"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg text-xs">
                    <p className="font-semibold mb-1">{data.date}</p>
                    <p className="text-gray-600">Open: <span className="font-medium">₹{data.open.toFixed(2)}</span></p>
                    <p className="text-gray-600">High: <span className="font-medium">₹{data.high.toFixed(2)}</span></p>
                    <p className="text-gray-600">Low: <span className="font-medium">₹{data.low.toFixed(2)}</span></p>
                    <p className="text-gray-600">Close: <span className="font-medium">₹{data.close.toFixed(2)}</span></p>
                    <p className={`font-semibold ${data.isGreen ? 'text-green-600' : 'text-red-600'}`}>
                      {data.isGreen ? '↑' : '↓'} {Math.abs(data.close - data.open).toFixed(2)} 
                      ({(Math.abs(data.close - data.open) / data.open * 100).toFixed(2)}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar yAxisId="volume" dataKey="volume" fill="#94a3b8" opacity={0.3} />
          <Bar yAxisId="price" dataKey="high" shape={<CustomCandlestick />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
