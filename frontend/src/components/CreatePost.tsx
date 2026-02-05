'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: () => void;
  defaultSymbol?: string;
  defaultCommunity?: string;
}

export default function CreatePost({ onClose, onPostCreated, defaultSymbol, defaultCommunity }: CreatePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [symbol, setSymbol] = useState(defaultSymbol || '');
  const [community, setCommunity] = useState(defaultCommunity || 'all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to create a post');
        return;
      }

      const response = await fetch('http://localhost:8000/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          symbol: symbol || null,
          community: community !== 'all' ? community : null
        })
      });

      if (response.ok) {
        onPostCreated();
        onClose();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create post');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Community *
            </label>
            <select
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">General Discussion</option>
              <option value="longterm">Long Term Investing</option>
              <option value="shortterm">Short Term Trading</option>
              <option value="daytrading">Day Trading</option>
              <option value="technical">Technical Analysis</option>
              <option value="fundamental">Fundamental Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stock Symbol (Optional)
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., RELIANCE, TCS"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your post about?"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
              minLength={5}
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/255 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, analysis, or experience..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[200px] resize-y"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || title.length < 5 || content.length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Post
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
