'use client';

import { Position } from '@/lib/api';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
  onTrade: (symbol: string, action: 'BUY' | 'SELL') => void;
}

export default function PositionsTable({ positions, onTrade }: PositionsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Your Positions</h3>
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No positions yet</p>
          <p className="text-gray-600 text-sm">Start trading to build your portfolio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Your Positions ({positions.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm border-b border-[#262626]">
              <th className="pb-3 font-semibold">Symbol</th>
              <th className="pb-3 font-semibold text-right">Quantity</th>
              <th className="pb-3 font-semibold text-right">Avg Price</th>
              <th className="pb-3 font-semibold text-right">Current Price</th>
              <th className="pb-3 font-semibold text-right">Current Value</th>
              <th className="pb-3 font-semibold text-right">P&L</th>
              <th className="pb-3 font-semibold text-right">P&L %</th>
              <th className="pb-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {positions.map((position) => {
              const pnlPositive = (position.unrealized_pnl || 0) >= 0;
              
              return (
                <tr key={position.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-4">
                    <div>
                      <div className="font-semibold text-white">{position.symbol}</div>
                      {position.sector && (
                        <div className="text-xs text-gray-600">{position.sector}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-right text-gray-400">{position.quantity}</td>
                  <td className="py-4 text-right text-gray-400">
                    ₹{position.avg_buy_price.toFixed(2)}
                  </td>
                  <td className="py-4 text-right text-gray-400">
                    {position.current_price ? `₹${position.current_price.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-4 text-right font-semibold text-white">
                    ₹{(position.current_value || position.invested_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className={`py-4 text-right font-semibold ${
                    pnlPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {pnlPositive ? '+' : ''}₹{(position.unrealized_pnl || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className={`py-4 text-right font-semibold ${
                    pnlPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      {pnlPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {pnlPositive ? '+' : ''}{(position.unrealized_pnl_percent || 0).toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onTrade(position.symbol, 'BUY')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Buy More
                      </button>
                      <button
                        onClick={() => onTrade(position.symbol, 'SELL')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-[#404040]">
            <tr>
              <td colSpan={4} className="pt-4 text-right font-semibold text-gray-400">
                Total Invested:
              </td>
              <td className="pt-4 text-right font-bold text-white">
                ₹{positions.reduce((sum, p) => sum + p.invested_amount, 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td className="pt-4 text-right font-bold text-white">
                ₹{positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
