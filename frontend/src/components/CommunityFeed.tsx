'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Clock, Pin, ArrowUp, ArrowDown } from 'lucide-react';

interface User {
  id: number;
  username: string;
  reputation: number;
  avatar_url?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  symbol?: string;
  author: User;
  views: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  user_vote?: number;
}

interface CommunityFeedProps {
  symbol?: string;
  community?: string;
  onPostClick?: (postId: number) => void;
  onUserClick?: (username: string) => void;
}

export default function CommunityFeed({ symbol, community, onPostClick, onUserClick }: CommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [sort, page, symbol, community]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sort,
        ...(symbol && { symbol }),
        ...(community && community !== 'all' && { community })
      });

      const response = await fetch(`http://localhost:8000/api/community/feed?${params}`);
      const data = await response.json();
      
      setPosts(data.posts);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId: number, voteType: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 bg-[#121212] rounded-lg p-2 border border-[#262626]">
        <button
          onClick={() => setSort('hot')}
          className={`flex items-center gap-1 px-4 py-2 rounded-md transition-colors ${
            sort === 'hot' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Hot
        </button>
        <button
          onClick={() => setSort('new')}
          className={`flex items-center gap-1 px-4 py-2 rounded-md transition-colors ${
            sort === 'new' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          New
        </button>
        <button
          onClick={() => setSort('top')}
          className={`flex items-center gap-1 px-4 py-2 rounded-md transition-colors ${
            sort === 'top' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <ArrowUp className="w-4 h-4" />
          Top
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-[#121212] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors border border-[#262626]"
          >
            <div className="flex gap-3">
              {/* Vote Section */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleVote(post.id, post.user_vote === 1 ? 0 : 1)}
                  className={`p-1 rounded hover:bg-[#262626] transition-colors ${
                    post.user_vote === 1 ? 'text-orange-500' : 'text-gray-500'
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <span className={`font-semibold ${
                  post.upvotes - post.downvotes > 0 ? 'text-orange-500' :
                  post.upvotes - post.downvotes < 0 ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {post.upvotes - post.downvotes}
                </span>
                <button
                  onClick={() => handleVote(post.id, post.user_vote === -1 ? 0 : -1)}
                  className={`p-1 rounded hover:bg-[#262626] transition-colors ${
                    post.user_vote === -1 ? 'text-blue-500' : 'text-gray-500'
                  }`}
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  {post.is_pinned && (
                    <Pin className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                  )}
                  {post.symbol && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {post.symbol}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-500 cursor-pointer"
                    onClick={() => onPostClick?.(post.id)}>
                  {post.title}
                </h3>

                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="hover:text-blue-400 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onUserClick?.(post.author.username); }}>
                    u/{post.author.username}
                  </span>
                  <span className="text-yellow-500">
                    {post.author.reputation} rep
                  </span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                  <div className="flex items-center gap-1 hover:text-blue-400 cursor-pointer"
                       onClick={() => onPostClick?.(post.id)}>
                    <MessageSquare className="w-4 h-4" />
                    {post.comment_count} comments
                  </div>
                  <span>{post.views} views</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#121212] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] border border-[#262626]"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[#121212] text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] border border-[#262626]"
          >
            Next
          </button>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-600">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
