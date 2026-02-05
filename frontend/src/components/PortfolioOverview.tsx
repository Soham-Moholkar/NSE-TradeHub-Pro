'use client';

import { Portfolio } from '@/lib/api';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Target, Activity } from 'lucide-react';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

export default function PortfolioOverview({ portfolio }: PortfolioOverviewProps) {
  const returnsPositive = portfolio.returns_percentage >= 0;

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* Total Value */}
      <div className="bg-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-200 text-sm font-medium">Total Value</span>
          <Wallet className="h-5 w-5 text-blue-200" />
        </div>
        <div className="text-3xl font-bold mb-1">
          ₹{portfolio.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-blue-200 text-sm">Portfolio Balance</div>
      </div>

      {/* Cash Balance */}
      <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm font-medium">Cash</span>
          <DollarSign className="h-5 w-5 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          ₹{portfolio.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-gray-500 text-sm">
          {((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)}% Available
        </div>
      </div>

      {/* Total Returns */}
      <div className={`rounded-lg p-6 border ${
        returnsPositive 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm font-medium">Returns</span>
          {returnsPositive ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className={`text-2xl font-bold mb-1 ${
          returnsPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          {returnsPositive ? '+' : ''}₹{portfolio.total_returns.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-sm font-semibold ${
          returnsPositive ? 'text-green-400' : 'text-red-400'
        }`}>
          {returnsPositive ? '+' : ''}{portfolio.returns_percentage.toFixed(2)}%
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm font-medium">Health Score</span>
          <Activity className="h-5 w-5 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {portfolio.health_score?.toFixed(0) || 'N/A'}/100
        </div>
        {portfolio.health_score && (
          <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                portfolio.health_score >= 80 ? 'bg-green-500' :
                portfolio.health_score >= 65 ? 'bg-lime-500' :
                portfolio.health_score >= 50 ? 'bg-yellow-500' :
                portfolio.health_score >= 35 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${portfolio.health_score}%` }}
            />
          </div>
        )}
      </div>

      {/* Diversification */}
      <div className="bg-[#121212] rounded-lg p-6 border border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm font-medium">Diversification</span>
          <Target className="h-5 w-5 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {portfolio.diversification_score?.toFixed(0) || 'N/A'}/100
        </div>
        {portfolio.diversification_score && (
          <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                portfolio.diversification_score >= 70 ? 'bg-blue-500' :
                portfolio.diversification_score >= 50 ? 'bg-yellow-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${portfolio.diversification_score}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
