'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, api } from '@/lib/api';
import { X, AlertCircle, TrendingUp, TrendingDown, Calculator } from 'lucide-react';

interface BuySellModalProps {
  symbol: string;
  action: 'BUY' | 'SELL';
  onClose: () => void;
  onComplete: () => void;
}

export default function BuySellModal({ symbol: initialSymbol, action, onClose, onComplete }: BuySellModalProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState(10);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulation, setSimulation] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    if (symbol) {
      loadCurrentPrice();
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol && quantity > 0) {
      simulateTrade();
    }
  }, [symbol, quantity]);

  const loadCurrentPrice = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get(`/api/prices/${symbol}/latest`);
      setCurrentPrice(response.data.close);
      setLimitPrice(response.data.close);
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const simulateTrade = async () => {
    if (!symbol || quantity <= 0) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.simulateTrade({
        symbol,
        side: action,
        quantity
      });
      setSimulation(response.data);
      setError('');
    } catch (error: any) {
      setSimulation(null);
      setError(error.response?.data?.detail || 'Failed to simulate trade');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await tradingAPI.placeOrder({
        symbol,
        side: action,
        quantity,
        order_type: orderType,
        limit_price: orderType === 'LIMIT' ? limitPrice : undefined
      });

      onComplete();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#262626]">
        {/* Header */}
        <div className={`p-6 border-b border-[#262626] ${
          action === 'BUY' ? 'bg-green-600/10' : 'bg-red-600/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {action === 'BUY' ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {action === 'BUY' ? 'Buy' : 'Sell'} Stocks
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Symbol Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stock Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-[#0d0d0d] border border-[#333333] rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., RELIANCE"
              required
            />
            {currentPrice > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Current Price: ₹{currentPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full bg-[#0d0d0d] border border-[#333333] rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  orderType === 'MARKET'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#262626] border border-[#333333]'
                }`}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`px-4 py-3 rounded-md font-medium transition-colors ${
                  orderType === 'LIMIT'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#262626] border border-[#333333]'
                }`}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price (if LIMIT order) */}
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limit Price
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Simulation Results */}
          {simulation && simulation.valid && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-4">
              <div className="flex items-start gap-3">
                <Calculator className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Cost:</span>
                    <span className="text-white font-semibold">
                      ₹{simulation.estimated_cost?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fees:</span>
                    <span className="text-white">
                      ₹{simulation.estimated_fees?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-500/30 pt-2">
                    <span className="text-gray-300 font-semibold">Total:</span>
                    <span className="text-white font-bold">
                      ₹{simulation.total_cost?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">New Cash Balance:</span>
                    <span className="text-white">
                      ₹{simulation.new_cash_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}
                    </span>
                  </div>
                  {simulation.warnings && simulation.warnings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-500/30">
                      {simulation.warnings.map((warning: string, idx: number) => (
                        <div key={idx} className="text-yellow-400 text-xs flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1a1a1a] hover:bg-[#262626] text-white px-4 py-3 rounded-md font-medium transition-colors border border-[#333333]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !simulation?.valid}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors ${
                action === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : `${action === 'BUY' ? 'Buy' : 'Sell'} ${quantity} Shares`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
