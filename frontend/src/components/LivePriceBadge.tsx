'use client';

import React from 'react';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react';

interface LivePriceBadgeProps {
  symbol: string;
  showDetails?: boolean;
  className?: string;
}

export default function LivePriceBadge({ 
  symbol, 
  showDetails = true,
  className = '' 
}: LivePriceBadgeProps) {
  const { price, connected, error } = useRealtimePrice(symbol);

  if (error) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 ${className}`}>
        <WifiOff className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">Connection Error</span>
      </div>
    );
  }

  if (!price) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  const isPositive = price.changePercent > 0;
  const isNegative = price.changePercent < 0;
  const isNeutral = price.changePercent === 0;

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        {connected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-400" />
        )}
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
          ₹{price.price.toFixed(2)}
        </span>

        {/* Change badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold ${
          isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          isNegative ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
        }`}>
          {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
          {isNeutral && <Minus className="w-3.5 h-3.5" />}
          <span>
            {isPositive && '+'}{price.change.toFixed(2)} ({isPositive && '+'}{price.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Additional details */}
      {showDetails && (
        <div className="flex items-center gap-4 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Open</span>
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
              ₹{price.open.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">High</span>
            <span className="font-mono font-semibold text-green-600 dark:text-green-400">
              ₹{price.high.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Low</span>
            <span className="font-mono font-semibold text-red-600 dark:text-red-400">
              ₹{price.low.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Volume</span>
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
              {(price.volume / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Bid/Ask</span>
            <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
              {price.bid.toFixed(2)}/{price.ask.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
