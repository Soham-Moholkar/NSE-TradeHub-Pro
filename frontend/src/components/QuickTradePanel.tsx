'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface QuickTradePanelProps {
  symbol: string;
  currentPrice: number;
  onBuy: (quantity: number) => void;
  onSell: (quantity: number) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export default function QuickTradePanel({ 
  symbol, 
  currentPrice, 
  onBuy, 
  onSell, 
  isLoggedIn,
  onLoginRequired 
}: QuickTradePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');

  const estimatedCost = currentPrice * quantity;
  const fees = estimatedCost * 0.001; // 0.1% fee
  const totalCost = estimatedCost + fees;

  const handleTrade = (side: 'BUY' | 'SELL') => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    
    if (side === 'BUY') {
      onBuy(quantity);
    } else {
      onSell(quantity);
    }
  };

  const quickQuantities = [1, 5, 10, 25, 50];

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Quick Trade</h3>
          <span className="text-blue-400 text-sm font-medium">{symbol}</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Current Price */}
        <div className="mb-4 p-3 bg-[#0d0d0d] rounded-lg border border-[#262626]">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Current Price</span>
            <span className="text-2xl font-bold text-white">₹{currentPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Order Type Toggle */}
        <div className="mb-4">
          <div className="flex bg-[#0d0d0d] rounded-lg p-1 border border-[#262626]">
            <button
              onClick={() => setOrderType('MARKET')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                orderType === 'MARKET' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('LIMIT')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                orderType === 'LIMIT' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Quantity</label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] text-lg font-bold text-gray-300 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 h-10 text-center bg-[#0d0d0d] border border-[#262626] rounded-lg font-semibold text-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              min="1"
            />
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#262626] border border-[#262626] text-lg font-bold text-gray-300 transition-colors"
            >
              +
            </button>
          </div>
          
          {/* Quick Quantity Buttons */}
          <div className="flex gap-1.5 mt-2">
            {quickQuantities.map((qty) => (
              <button
                key={qty}
                onClick={() => setQuantity(qty)}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  quantity === qty 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#262626] border border-[#262626]'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-4 p-3 bg-[#0d0d0d] rounded-lg border border-[#262626]">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Cost</span>
              <span className="font-semibold text-gray-300">₹{estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fees (0.1%)</span>
              <span className="font-semibold text-gray-300">₹{fees.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#262626] pt-1.5 flex justify-between">
              <span className="font-medium text-blue-400">Total</span>
              <span className="font-bold text-blue-400">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleTrade('BUY')}
            className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            BUY
          </button>
          <button
            onClick={() => handleTrade('SELL')}
            className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            <TrendingDown className="w-5 h-5" />
            SELL
          </button>
        </div>

        {/* Login Warning */}
        {!isLoggedIn && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-yellow-500">Sign in to start paper trading</span>
          </div>
        )}
      </div>
    </div>
  );
}
