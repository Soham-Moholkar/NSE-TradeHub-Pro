'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  Brain,
  Activity,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Article {
  title: string;
  description: string;
  url: string;
  publisher: string;
  published_at: string;
  thumbnail: string;
  sentiment: {
    label: string;
    score: number;
    confidence: string;
  };
}

interface SentimentAnalysis {
  overall_sentiment: string;
  sentiment_score: number;
  confidence: string;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  total_articles: number;
}

interface AIInsights {
  summary: string;
  recommendation: string;
  key_themes: string[];
  risk_level: string;
  confidence: string;
  recent_news_count: number;
}

interface NewsData {
  symbol: string;
  articles: Article[];
  sentiment_analysis: SentimentAnalysis;
  ai_insights: AIInsights;
  model_used: string;
}

interface NewsAnalysisProps {
  symbol: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function NewsAnalysis({ symbol }: NewsAnalysisProps) {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, [symbol]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/news/${symbol}?limit=15`);
      setNewsData(response.data);
    } catch (err: any) {
      console.error('Failed to load news:', err);
      setError(err.response?.data?.detail || 'Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Newspaper className="h-6 w-6 text-blue-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">News & Sentiment Analysis</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-[#1a1a1a] rounded"></div>
          <div className="h-24 bg-[#1a1a1a] rounded"></div>
          <div className="h-24 bg-[#1a1a1a] rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Newspaper className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">News & Sentiment Analysis</h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={loadNews}
                className="mt-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!newsData || newsData.articles.length === 0) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Newspaper className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">News & Sentiment Analysis</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No recent news articles found for {symbol}</p>
        </div>
      </div>
    );
  }

  const { articles, sentiment_analysis, ai_insights, model_used } = newsData;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Newspaper className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">News & Sentiment Analysis</h3>
              <p className="text-xs text-gray-500">Powered by {model_used}</p>
            </div>
          </div>
          <button
            onClick={loadNews}
            className="flex items-center space-x-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-blue-400 rounded-lg transition-colors border border-[#262626]"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        {/* Sentiment Overview */}
        <div className={`p-6 rounded-lg border ${getSentimentColors(sentiment_analysis.overall_sentiment).bg}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getSentimentIcon(sentiment_analysis.overall_sentiment)}
              <div>
                <h4 className="text-2xl font-bold text-white">
                  {sentiment_analysis.overall_sentiment.toUpperCase()}
                </h4>
                <p className="text-sm text-gray-400">Overall Market Sentiment</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {(sentiment_analysis.sentiment_score * 100).toFixed(0)}
              </div>
              <p className="text-xs text-gray-400">Sentiment Score</p>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="space-y-2">
            <SentimentBar 
              label="Positive"
              count={sentiment_analysis.distribution.positive}
              total={sentiment_analysis.total_articles}
              color="green"
            />
            <SentimentBar 
              label="Neutral"
              count={sentiment_analysis.distribution.neutral}
              total={sentiment_analysis.total_articles}
              color="gray"
            />
            <SentimentBar 
              label="Negative"
              count={sentiment_analysis.distribution.negative}
              total={sentiment_analysis.total_articles}
              color="red"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Analyzed {sentiment_analysis.total_articles} articles
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              sentiment_analysis.confidence === 'high' || sentiment_analysis.confidence === 'very_high'
                ? 'bg-green-500/20 text-green-400'
                : sentiment_analysis.confidence === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {sentiment_analysis.confidence.replace('_', ' ').toUpperCase()} Confidence
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-purple-600 rounded-lg border border-purple-500 p-6 text-white">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-6 w-6" />
          <h4 className="text-lg font-bold">AI-Powered Insights</h4>
        </div>

        <p className="text-purple-100 mb-4 leading-relaxed">{ai_insights.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">Recommendation</span>
            </div>
            <div className="text-2xl font-bold">
              {ai_insights.recommendation.toUpperCase()}
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Risk Level</span>
            </div>
            <div className="text-2xl font-bold">
              {ai_insights.risk_level.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {ai_insights.key_themes.length > 0 && (
          <div className="bg-black/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Key Themes in News</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ai_insights.key_themes.map((theme, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {ai_insights.recent_news_count > 0 && (
          <div className="mt-4 flex items-center space-x-2 text-purple-100">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {ai_insights.recent_news_count} articles published in the last 24 hours
            </span>
          </div>
        )}
      </div>

      {/* News Articles */}
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Latest News Articles</h4>
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <NewsArticleCard key={idx} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function NewsArticleCard({ article }: { article: Article }) {
  const sentimentColors = {
    positive: 'border-l-green-500 bg-green-500/5',
    neutral: 'border-l-gray-500 bg-[#1a1a1a]',
    negative: 'border-l-red-500 bg-red-500/5'
  };

  const sentimentIcons = {
    positive: <TrendingUp className="h-4 w-4 text-green-500" />,
    neutral: <Minus className="h-4 w-4 text-gray-500" />,
    negative: <TrendingDown className="h-4 w-4 text-red-500" />
  };

  return (
    <div className={`border-l-4 ${sentimentColors[article.sentiment.label as keyof typeof sentimentColors]} rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <a 
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-white hover:text-blue-400 line-clamp-2 flex items-start space-x-2"
          >
            <span className="flex-1">{article.title}</span>
            <ExternalLink className="h-4 w-4 flex-shrink-0 mt-1" />
          </a>
        </div>
      </div>

      {article.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{article.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4 text-gray-500">
          <span className="font-medium">{article.publisher}</span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {sentimentIcons[article.sentiment.label as keyof typeof sentimentIcons]}
          <span className="font-medium text-gray-400">
            {article.sentiment.label} ({(article.sentiment.score * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

function SentimentBar({ label, count, total, color }: { 
  label: string; 
  count: number; 
  total: number; 
  color: 'green' | 'gray' | 'red' 
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colors = {
    green: 'bg-green-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400">{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
        <div 
          className={`${colors[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getSentimentIcon(sentiment: string) {
  if (sentiment === 'positive') {
    return (
      <div className="p-3 bg-green-500/20 rounded-full">
        <TrendingUp className="h-6 w-6 text-green-500" />
      </div>
    );
  } else if (sentiment === 'negative') {
    return (
      <div className="p-3 bg-red-500/20 rounded-full">
        <TrendingDown className="h-6 w-6 text-red-500" />
      </div>
    );
  }
  return (
    <div className="p-3 bg-gray-500/20 rounded-full">
      <Minus className="h-6 w-6 text-gray-500" />
    </div>
  );
}

function getSentimentColors(sentiment: string) {
  if (sentiment === 'positive') {
    return { bg: 'bg-green-500/10 border-green-500/30' };
  } else if (sentiment === 'negative') {
    return { bg: 'bg-red-500/10 border-red-500/30' };
  }
  return { bg: 'bg-[#1a1a1a] border-[#333333]' };
}
