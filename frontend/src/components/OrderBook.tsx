'use client';

import React from 'react';
import { OrderBook as OrderBookType } from '@/hooks/useRealtimePrice';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OrderBookProps {
  orderBook: OrderBookType | null;
  loading?: boolean;
}

export default function OrderBook({ orderBook, loading }: OrderBookProps) {
  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
        <h3 className="text-lg font-bold text-white mb-4">
          Order Book
        </h3>
        <div className="animate-pulse space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="h-4 bg-[#1a1a1a] rounded w-1/3"></div>
              <div className="h-4 bg-[#1a1a1a] rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!orderBook) {
    return (
      <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
        <h3 className="text-lg font-bold text-white mb-4">
          Order Book
        </h3>
        <div className="text-center text-gray-500 py-8">
          <p>No order book data available</p>
          <p className="text-sm mt-2">Connect to live data stream</p>
        </div>
      </div>
    );
  }

  // Calculate max quantity for scaling bars
  const allLevels = [...orderBook.bids, ...orderBook.asks];
  const maxQuantity = Math.max(...allLevels.map(level => level.quantity));

  const renderLevel = (level: { price: number; quantity: number; orders: number }, type: 'bid' | 'ask') => {
    const barWidth = (level.quantity / maxQuantity) * 100;
    const isBid = type === 'bid';

    return (
      <div className="relative group">
        {/* Background bar */}
        <div 
          className={`absolute inset-y-0 ${isBid ? 'right-0 bg-green-500/10' : 'left-0 bg-red-500/10'} transition-all`}
          style={{ width: `${barWidth}%` }}
        />

        {/* Content */}
        <div className={`relative flex items-center justify-between gap-4 px-3 py-1.5 hover:bg-[#1a1a1a] transition-colors cursor-pointer`}>
          <div className={`flex items-center gap-2 ${isBid ? 'flex-row' : 'flex-row-reverse'} flex-1`}>
            {/* Price */}
            <span className={`font-mono text-sm font-semibold ${
              isBid ? 'text-green-400' : 'text-red-400'
            }`}>
              ₹{level.price.toFixed(2)}
            </span>

            {/* Quantity */}
            <span className="text-xs text-gray-400 font-medium">
              {level.quantity.toLocaleString()}
            </span>

            {/* Orders count */}
            <span className="text-xs text-gray-500">
              ({level.orders})
            </span>
          </div>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#262626]">
          {level.orders} orders, {level.quantity.toLocaleString()} qty
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Order Book
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Spread:</span>
            <span className="font-mono font-semibold text-white">
              ₹{orderBook.spread.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center justify-between mt-3 text-xs font-semibold text-gray-500 px-3">
          <span>Price</span>
          <span>Quantity</span>
        </div>
      </div>

      {/* Order book content */}
      <div className="max-h-[500px] overflow-y-auto">
        {/* Asks (Sell Orders) - Top half, reversed order */}
        <div className="border-b border-[#333333]">
          {orderBook.asks.slice().reverse().slice(0, 10).map((level, index) => (
            <div key={`ask-${index}`}>
              {renderLevel(level, 'ask')}
            </div>
          ))}
        </div>

        {/* Spread indicator */}
        <div className="bg-[#0d0d0d] py-2 px-4 flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm font-bold text-gray-300">
            Spread: ₹{orderBook.spread.toFixed(2)}
          </span>
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>

        {/* Bids (Buy Orders) - Bottom half */}
        <div>
          {orderBook.bids.slice(0, 10).map((level, index) => (
            <div key={`bid-${index}`}>
              {renderLevel(level, 'bid')}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with timestamp */}
      <div className="p-2 bg-[#0d0d0d] border-t border-[#262626] text-center">
        <span className="text-xs text-gray-500">
          Last updated: {new Date(orderBook.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
