'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, TradingSignal, api } from '@/lib/api';
import { Star, TrendingUp, Zap, RefreshCw } from 'lucide-react';

interface TradingSignalsProps {
  onTrade?: (symbol: string, action: 'BUY' | 'SELL') => void;
}

export default function TradingSignals({ onTrade }: TradingSignalsProps) {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [generatingSignal, setGeneratingSignal] = useState(false);

  const loadRecentSignals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.getSignals(undefined, 5);
      setSignals(response.data);
    } catch (error) {
      console.error('Error loading signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSignal = async () => {
    if (!selectedSymbol) return;

    try {
      setGeneratingSignal(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.getSignal(selectedSymbol);
      
      // Add new signal to the top of the list
      setSignals([response.data, ...signals.slice(0, 4)]);
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setGeneratingSignal(false);
    }
  };

  useEffect(() => {
    loadRecentSignals();
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'SELL':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  return (
    <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Trading Signals
        </h3>
        <button
          onClick={loadRecentSignals}
          disabled={loading}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Refresh signals"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Generate New Signal */}
      <div className="mb-6 p-4 bg-[#0d0d0d] rounded-md border border-[#262626]">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Generate Signal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
            placeholder="Symbol (e.g., RELIANCE)"
            className="flex-1 bg-[#1a1a1a] border border-[#333333] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={generateSignal}
            disabled={generatingSignal || !selectedSymbol}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingSignal ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No signals yet</p>
            <p className="text-gray-600 text-xs mt-1">Generate a signal above</p>
          </div>
        ) : (
          signals.map((signal, idx) => (
            <div
              key={idx}
              className={`border rounded-md p-4 ${getSignalColor(signal.signal)}`}
            >
              {/* Signal Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-lg">{signal.signal}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(signal.generated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= signal.strength
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Price Info */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <div className="text-gray-500">Current</div>
                  <div className="font-semibold text-white">₹{signal.current_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Entry</div>
                  <div className="font-semibold text-white">₹{signal.entry_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Target</div>
                  <div className="font-semibold text-green-400">₹{signal.target_price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Stop Loss</div>
                  <div className="font-semibold text-red-400">₹{signal.stop_loss.toFixed(2)}</div>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-semibold text-white">{signal.confidence.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      signal.signal === 'BUY' ? 'bg-green-500' :
                      signal.signal === 'SELL' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${signal.confidence}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                {signal.reasoning}
              </div>

              {/* Action Button */}
              {onTrade && signal.signal !== 'HOLD' && (
                <button
                  onClick={() => onTrade('symbol' in signal ? (signal as any).symbol : selectedSymbol, signal.signal as 'BUY' | 'SELL')}
                  className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${
                    signal.signal === 'BUY'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {signal.signal === 'BUY' ? 'Buy Now' : 'Sell Now'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
