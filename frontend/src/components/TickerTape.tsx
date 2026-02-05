'use client';

import React, { useEffect, useRef } from 'react';
import { useMarketFeed } from '@/hooks/useRealtimePrice';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TickerTapeProps {
  symbols?: string[];
  speed?: number; // pixels per second
}

const defaultSymbols = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'BAJFINANCE',
  'KOTAKBANK', 'LT', 'ASIANPAINT', 'AXISBANK', 'MARUTI',
  'WIPRO', 'TITAN', 'SUNPHARMA', 'ULTRACEMCO', 'NESTLEIND'
];

export default function TickerTape({ 
  symbols = defaultSymbols,
  speed = 50 
}: TickerTapeProps) {
  const { prices, connected } = useMarketFeed(symbols);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let position = 0;
    const containerWidth = scrollContainer.scrollWidth / 2; // Half because we duplicate content

    const animate = () => {
      position -= speed / 60; // 60fps
      
      // Reset position when first set of items scrolls out
      if (Math.abs(position) >= containerWidth) {
        position = 0;
      }

      scrollContainer.style.transform = `translateX(${position}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, Object.keys(prices).length]);

  const renderTickerItem = (symbol: string, index: number) => {
    const priceData = prices[symbol];
    
    if (!priceData) {
      return (
        <div key={`${symbol}-${index}`} className="flex items-center gap-2 px-4 py-2 border-r border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-400 text-sm">{symbol}</span>
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      );
    }

    const isPositive = priceData.changePercent > 0;
    const isNegative = priceData.changePercent < 0;
    const isNeutral = priceData.changePercent === 0;

    return (
      <div 
        key={`${symbol}-${index}`}
        className="flex items-center gap-3 px-4 py-2 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap"
      >
        {/* Symbol */}
        <span className="font-bold text-gray-900 dark:text-white text-sm">
          {symbol}
        </span>

        {/* Price */}
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
          ₹{priceData.price.toFixed(2)}
        </span>

        {/* Change */}
        <div className={`flex items-center gap-1 text-xs font-medium ${
          isPositive ? 'text-green-600 dark:text-green-400' : 
          isNegative ? 'text-red-600 dark:text-red-400' : 
          'text-gray-500'
        }`}>
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {isNeutral && <Minus className="w-3 h-3" />}
          <span>
            {isPositive && '+'}{priceData.changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Volume (compact) */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Vol: {(priceData.volume / 1000).toFixed(0)}K
        </span>
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-30 overflow-hidden">
      {/* Connection Status */}
      {!connected && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white text-xs text-center py-0.5">
          Connecting to live data...
        </div>
      )}

      {/* Scrolling Ticker */}
      <div className="relative h-10 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex items-center absolute top-0 left-0 h-full"
          style={{ willChange: 'transform' }}
        >
          {/* First set of items */}
          {symbols.map((symbol, index) => renderTickerItem(symbol, index))}
          
          {/* Duplicate for seamless loop */}
          {symbols.map((symbol, index) => renderTickerItem(symbol, index + symbols.length))}
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-2 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}
