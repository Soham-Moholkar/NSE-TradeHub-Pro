'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, MessageSquare, X, Send } from 'lucide-react';

interface User {
  id: number;
  username: string;
  reputation: number;
  avatar_url?: string;
}

interface Comment {
  id: number;
  content: string;
  author: User;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote?: number;
  replies: Comment[];
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
  is_pinned: boolean;
  created_at: string;
  user_vote?: number;
}

interface PostDetailProps {
  postId: number;
  onClose: () => void;
  currentUser?: User;
}

export default function PostDetail({ postId, onClose, currentUser }: PostDetailProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostDetail();
    fetchComments();
  }, [postId]);

  const fetchPostDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/community/posts/${postId}`);
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8000/api/community/posts/${postId}/comments`, {
        headers
      });
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleVotePost = async (voteType: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      await fetch(`http://localhost:8000/api/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      fetchPostDetail();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleVoteComment = async (commentId: number, voteType: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to vote');
        return;
      }

      await fetch(`http://localhost:8000/api/community/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      fetchComments();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAddComment = async (parentId?: number) => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to comment');
        return;
      }

      await fetch('http://localhost:8000/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          post_id: postId,
          parent_id: parentId
        })
      });

      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
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

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="bg-gray-800 rounded-lg p-4 border-l-2 border-gray-700">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleVoteComment(comment.id, comment.user_vote === 1 ? 0 : 1)}
              className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                comment.user_vote === 1 ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <span className={`text-sm font-semibold ${
              comment.upvotes - comment.downvotes > 0 ? 'text-orange-500' :
              comment.upvotes - comment.downvotes < 0 ? 'text-blue-500' : 'text-gray-400'
            }`}>
              {comment.upvotes - comment.downvotes}
            </span>
            <button
              onClick={() => handleVoteComment(comment.id, comment.user_vote === -1 ? 0 : -1)}
              className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                comment.user_vote === -1 ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 text-sm">
              <span className="text-blue-400 font-medium hover:underline cursor-pointer">
                u/{comment.author.username}
              </span>
              <span className="text-yellow-500">{comment.author.reputation} rep</span>
              <span className="text-gray-500">{formatTimeAgo(comment.created_at)}</span>
            </div>
            <p className="text-gray-200 whitespace-pre-wrap">{comment.content}</p>
            <button
              onClick={() => setReplyTo(comment.id)}
              className="mt-2 text-sm text-gray-400 hover:text-blue-400 flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              Reply
            </button>

            {replyTo === comment.id && (
              <div className="mt-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddComment(comment.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Post Reply
                  </button>
                  <button
                    onClick={() => { setReplyTo(null); setNewComment(''); }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  if (loading || !post) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Post Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVotePost(post.user_vote === 1 ? 0 : 1)}
                  className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                    post.user_vote === 1 ? 'text-orange-500' : 'text-gray-400'
                  }`}
                >
                  <ArrowUp className="w-6 h-6" />
                </button>
                <span className={`text-xl font-bold ${
                  post.upvotes - post.downvotes > 0 ? 'text-orange-500' :
                  post.upvotes - post.downvotes < 0 ? 'text-blue-500' : 'text-gray-400'
                }`}>
                  {post.upvotes - post.downvotes}
                </span>
                <button
                  onClick={() => handleVotePost(post.user_vote === -1 ? 0 : -1)}
                  className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                    post.user_vote === -1 ? 'text-blue-500' : 'text-gray-400'
                  }`}
                >
                  <ArrowDown className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1">
                {post.symbol && (
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full mb-3">
                    {post.symbol}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-white mb-3">{post.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                  <span className="text-blue-400 hover:underline cursor-pointer">
                    u/{post.author.username}
                  </span>
                  <span className="text-yellow-500">{post.author.reputation} rep</span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                  <span>{post.views} views</span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              </div>
            </div>
          </div>

          {currentUser && replyTo === null && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Add a Comment</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
              />
              <button
                onClick={() => handleAddComment()}
                disabled={!newComment.trim()}
                className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Comment
              </button>
            </div>
          )}

          {!currentUser && (
            <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400">Please login to comment</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Comments ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {comments.map(comment => renderComment(comment))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
