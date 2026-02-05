'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Award, MessageSquare, FileText, TrendingUp } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  reputation: number;
  is_verified: boolean;
  created_at: string;
  post_count: number;
  comment_count: number;
  total_upvotes: number;
}

interface UserProfileProps {
  username: string;
  onClose: () => void;
}

export default function UserProfile({ username, onClose }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/community/users/${username}`);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setError('User not found');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full" />
              ) : (
                <UserIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">u/{user.username}</h2>
                {user.is_verified && (
                  <Award className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              {user.full_name && (
                <p className="text-gray-200">{user.full_name}</p>
              )}
              <p className="text-sm text-gray-300 mt-1">Member since {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">{user.reputation}</div>
            <div className="text-xs text-gray-400">Reputation</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white">{user.post_count}</div>
            <div className="text-xs text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white">{user.comment_count}</div>
            <div className="text-xs text-gray-400">Comments</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-white">{user.total_upvotes}</div>
            <div className="text-xs text-gray-400">Upvotes</div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">About</h3>
            <p className="text-gray-400">{user.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
