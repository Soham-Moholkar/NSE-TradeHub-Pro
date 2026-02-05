'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

interface TechnicalIndicatorsProps {
  data: any;
  symbol: string;
}

export default function TechnicalIndicators({ data, symbol }: TechnicalIndicatorsProps) {
  const indicators = useMemo(() => {
    if (!data?.data || data.data.length === 0) return null;

    // Use only last 100 data points for performance
    const limitedData = data.data.slice(-100);
    const prices = limitedData.map((d: any) => d.close);
    const volumes = limitedData.map((d: any) => d.volume);
    const highs = limitedData.map((d: any) => d.high);
    const lows = limitedData.map((d: any) => d.low);

    // Calculate SMA
    const calculateSMA = (period: number) => {
      return prices.map((_: any, idx: number) => {
        if (idx < period - 1) return null;
        const sum = prices.slice(idx - period + 1, idx + 1).reduce((a: number, b: number) => a + b, 0);
        return sum / period;
      });
    };

    // Calculate RSI
    const calculateRSI = (period: number = 14) => {
      const rsi = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period) {
          rsi.push(null);
          continue;
        }
        let gains = 0;
        let losses = 0;
        for (let j = i - period + 1; j <= i; j++) {
          const change = prices[j] - prices[j - 1];
          if (change > 0) gains += change;
          else losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 1);
        rsi.push(100 - 100 / (1 + rs));
      }
      return rsi;
    };

    // Calculate MACD
    const calculateEMA = (data: number[], period: number) => {
      const k = 2 / (period + 1);
      const ema = [data[0]];
      for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
      }
      return ema;
    };

    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12.map((val, idx) => val - ema26[idx]);
    const signalLine = calculateEMA(macdLine, 9);

    // Calculate Bollinger Bands
    const sma20 = calculateSMA(20);
    const calculateStdDev = (idx: number, period: number) => {
      if (idx < period - 1) return 0;
      const slice = prices.slice(idx - period + 1, idx + 1);
      const mean = sma20[idx] || 0;
      const variance = slice.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / period;
      return Math.sqrt(variance);
    };

    const chartData = limitedData.map((d: any, idx: number) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: d.close,
      sma20: sma20[idx],
      sma50: calculateSMA(50)[idx],
      rsi: calculateRSI()[idx],
      macd: macdLine[idx],
      signal: signalLine[idx],
      upperBand: sma20[idx] ? sma20[idx]! + 2 * calculateStdDev(idx, 20) : null,
      lowerBand: sma20[idx] ? sma20[idx]! - 2 * calculateStdDev(idx, 20) : null,
    }));

    return chartData;
  }, [data]);

  if (!indicators) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RSI Chart */}
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">RSI - Relative Strength Index</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={indicators}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#404040" />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af' }} stroke="#404040" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Overbought", fill: "#ef4444", fontSize: 11 }} />
            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Oversold", fill: "#22c55e", fontSize: 11 }} />
            <Line type="monotone" dataKey="rsi" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center justify-center space-x-4 text-xs">
          <span className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-gray-400">Overbought (&gt;70)</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-gray-400">Oversold (&lt;30)</span>
          </span>
        </div>
      </div>

      {/* MACD Chart */}
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">MACD - Moving Average Convergence Divergence</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={indicators}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#404040" />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#404040" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <ReferenceLine y={0} stroke="#666" />
            <Line type="monotone" dataKey="macd" stroke="#10b981" strokeWidth={2} dot={false} name="MACD" />
            <Line type="monotone" dataKey="signal" stroke="#f59e0b" strokeWidth={2} dot={false} name="Signal" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Bollinger Bands</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={indicators}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#404040" />
            <YAxis tick={{ fill: '#9ca3af' }} stroke="#404040" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Area
              type="monotone"
              dataKey="upperBand"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.1}
              name="Upper Band"
            />
            <Area
              type="monotone"
              dataKey="lowerBand"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.1}
              name="Lower Band"
            />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" />
            <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="SMA 20" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
