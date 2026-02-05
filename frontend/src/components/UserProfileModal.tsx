'use client';

import { useState, useEffect } from 'react';
import { X, Award, MessageSquare, FileText, TrendingUp, Calendar } from 'lucide-react';

interface UserStats {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  reputation: number;
  created_at: string;
  post_count: number;
  comment_count: number;
  total_upvotes: number;
}

interface UserProfileModalProps {
  username: string;
  onClose: () => void;
}

export default function UserProfileModal({ username, onClose }: UserProfileModalProps) {
  const [user, setUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/community/users/${username}`);
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading || !user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-lg relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">u/{user.username}</h2>
              {user.full_name && (
                <p className="text-white text-opacity-80">{user.full_name}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-white text-opacity-70 text-sm">
                <Calendar className="w-4 h-4" />
                Member since {formatDate(user.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Reputation</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.reputation.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-gray-400 text-sm">Posts</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.post_count}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Comments</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.comment_count}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-orange-500">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400 text-sm">Upvotes Received</span>
              </div>
              <p className="text-2xl font-bold text-white">{user.total_upvotes}</p>
            </div>
          </div>

          {user.bio && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
              <p className="text-gray-300">{user.bio}</p>
            </div>
          )}

          {!user.bio && (
            <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-500">
              <p>No bio yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
