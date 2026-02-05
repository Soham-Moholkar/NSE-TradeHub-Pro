'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, LeaderboardEntry, api } from '@/lib/api';
import { Trophy, TrendingUp, Medal, Award, Crown } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    loadLeaderboard();
    
    // Get current user's username
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUsername(userData.username);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const loadLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.getLeaderboard(50);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-blue-500/20 border-blue-500';
    if (rank === 1) return 'bg-yellow-500/10';
    if (rank === 2) return 'bg-gray-500/10';
    if (rank === 3) return 'bg-amber-600/10';
    return 'bg-[#1a1a1a]';
  };

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="text-2xl font-bold text-white">Leaderboard</h3>
        <span className="ml-auto text-sm text-gray-500">
          Top {leaderboard.length} Traders
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No traders on the leaderboard yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-3 border-b border-[#262626] text-xs font-semibold text-gray-500">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Trader</div>
            <div className="col-span-2 text-right">Returns</div>
            <div className="col-span-2 text-right">Returns %</div>
            <div className="col-span-2 text-right">Trades</div>
            <div className="col-span-2 text-right">Win Rate</div>
          </div>

          {/* Leaderboard Entries */}
          <div className="space-y-1">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.username === currentUsername;
              const returnsPositive = entry.returns_percentage >= 0;

              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 rounded-lg border transition-all hover:scale-[1.01] ${
                    getRankBg(entry.rank, isCurrentUser)
                  } ${isCurrentUser ? 'border-blue-500' : 'border-transparent'}`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span className="font-bold text-gray-300">#{entry.rank}</span>
                  </div>

                  {/* Username */}
                  <div className="col-span-3 flex items-center">
                    <span className={`font-semibold ${isCurrentUser ? 'text-blue-400' : 'text-gray-300'}`}>
                      {entry.username}
                      {isCurrentUser && <span className="ml-2 text-xs text-blue-400">(You)</span>}
                    </span>
                  </div>

                  {/* Returns */}
                  <div className={`col-span-2 text-right font-semibold ${
                    returnsPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {returnsPositive ? '+' : ''}₹{entry.total_returns.toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </div>

                  {/* Returns % */}
                  <div className={`col-span-2 text-right font-bold ${
                    returnsPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {returnsPositive ? '+' : ''}{entry.returns_percentage.toFixed(2)}%
                  </div>

                  {/* Trades */}
                  <div className="col-span-2 text-right text-gray-400">
                    {entry.total_trades}
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 text-right">
                    <span className={`font-semibold ${
                      entry.win_rate >= 60 ? 'text-green-500' :
                      entry.win_rate >= 40 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {entry.win_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
