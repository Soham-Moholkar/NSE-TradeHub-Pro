'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tradingAPI } from '@/lib/api';
import { User, TrendingUp, Award, DollarSign, Calendar, Target, Trophy, BarChart3 } from 'lucide-react';

interface UserStats {
  totalTrades: number;
  winRate: number;
  totalReturns: number;
  returnsPercent: number;
  portfolioValue: number;
  rank: number;
  joinedDate: string;
  achievements: string[];
}

export default function UserProfilePage({ username }: { username: string }) {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, [username]);

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // Load user's trading statistics
      const [positionsRes, leaderboardRes] = await Promise.all([
        tradingAPI.getPositions(),
        tradingAPI.getLeaderboard(100),
      ]);

      const positions = positionsRes.data;
      const leaderboard = leaderboardRes.data;

      // Calculate stats
      const totalReturns = positions.reduce((sum: number, p: any) => sum + p.unrealized_pnl, 0);
      const portfolioValue = 100000 + totalReturns; // Assuming 100k starting capital
      const returnsPercent = (totalReturns / 100000) * 100;

      const userEntry = leaderboard.find((entry: any) => entry.username === username);
      const winRate = userEntry?.win_rate || 0;
      const rank = leaderboard.findIndex((entry: any) => entry.username === username) + 1;

      setStats({
        totalTrades: positions.length,
        winRate: winRate * 100,
        totalReturns,
        returnsPercent,
        portfolioValue,
        rank,
        joinedDate: '2024-01-01', // Would come from user data
        achievements: ['First Trade', 'Week Streak', 'Profit Master'], // Mock achievements
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  @{username}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(stats.joinedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>Rank #{stats.rank}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portfolio Value */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{stats.portfolioValue.toLocaleString()}
            </p>
          </div>

          {/* Total Returns */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${stats.totalReturns >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                <TrendingUp className={`w-5 h-5 ${stats.totalReturns >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns</span>
            </div>
            <p className={`text-2xl font-bold ${stats.totalReturns >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {stats.totalReturns >= 0 ? '+' : ''}₹{stats.totalReturns.toLocaleString()} ({stats.returnsPercent.toFixed(2)}%)
            </p>
          </div>

          {/* Total Trades */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trades</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalTrades}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.winRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-lg p-4 text-center"
              >
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {achievement}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Activity Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Trading Activity
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Activity chart coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
