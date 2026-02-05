'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, Achievement, api } from '@/lib/api';
import { Trophy, Award, Lock } from 'lucide-react';

export default function AchievementBadges() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.getAchievements();
      setAchievements(response.data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h3 className="text-2xl font-bold text-gray-100">Achievements</h3>
        <span className="ml-auto text-sm text-gray-400">
          {achievements.length} unlocked
        </span>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12">
          <Lock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No achievements unlocked yet</p>
          <p className="text-gray-600 text-sm mt-2">Start trading to earn badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-6 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-3 text-center">{achievement.icon}</div>
              <div className="text-center">
                <h4 className="font-bold text-gray-100 mb-1">{achievement.title}</h4>
                <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                <div className="text-xs text-gray-500">
                  Earned {new Date(achievement.earned_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
