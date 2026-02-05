'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, Portfolio, Position, Transaction } from '@/lib/api';
import PortfolioOverview from './PortfolioOverview';
import PositionsTable from './PositionsTable';
import BuySellModal from './BuySellModal';
import TradingSignals from './TradingSignals';
import PortfolioAnalysis from './PortfolioAnalysis';
import { TrendingUp, RefreshCw, DollarSign } from 'lucide-react';

export default function TradingDashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBuySellModal, setShowBuySellModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL'>('BUY');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load portfolio (create if doesn't exist)
      let portfolioData;
      try {
        const portfolioRes = await tradingAPI.getPortfolio();
        portfolioData = portfolioRes.data;
      } catch (error) {
        // Portfolio doesn't exist, create it
        const createRes = await tradingAPI.createPortfolio();
        portfolioData = createRes.data;
      }
      
      setPortfolio(portfolioData);

      // Load positions
      const positionsRes = await tradingAPI.getPositions();
      setPositions(positionsRes.data);

      // Load transactions
      const transactionsRes = await tradingAPI.getTransactions(20);
      setTransactions(transactionsRes.data);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleTrade = (symbol: string, action: 'BUY' | 'SELL') => {
    setSelectedSymbol(symbol);
    setTradeAction(action);
    setShowBuySellModal(true);
  };

  const handleTradeComplete = () => {
    setShowBuySellModal(false);
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your trading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Portfolio Found</h3>
        <p className="text-gray-500 mb-4">Create a portfolio to start paper trading</p>
        <button
          onClick={() => tradingAPI.createPortfolio().then(handleRefresh)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
        >
          Create Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            Paper Trading Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Manage your portfolio and execute trades</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Portfolio Overview */}
      <PortfolioOverview portfolio={portfolio} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Positions & Transactions */}
        <div className="col-span-2 space-y-6">
          {/* Positions */}
          <PositionsTable 
            positions={positions} 
            onTrade={handleTrade}
          />

          {/* Recent Transactions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions yet. Start trading to see your history here.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-700/50 rounded-md p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-md text-sm font-semibold ${
                        transaction.transaction_type === 'BUY' 
                          ? 'bg-green-500/20 text-green-400'
                          : transaction.transaction_type === 'SELL'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {transaction.transaction_type}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200">
                          {transaction.symbol || 'Account'}
                          {transaction.quantity && ` × ${transaction.quantity}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(transaction.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-200">
                        ₹{transaction.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {transaction.price && (
                        <div className="text-sm text-gray-400">
                          @ ₹{transaction.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Signals & Analysis */}
        <div className="space-y-6">
          <TradingSignals onTrade={handleTrade} />
          <PortfolioAnalysis portfolioId={portfolio.id} />
        </div>
      </div>

      {/* Buy/Sell Modal */}
      {showBuySellModal && (
        <BuySellModal
          symbol={selectedSymbol}
          action={tradeAction}
          onClose={() => setShowBuySellModal(false)}
          onComplete={handleTradeComplete}
        />
      )}
    </div>
  );
}
