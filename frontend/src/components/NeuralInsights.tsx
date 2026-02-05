'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface NeuralInsightsProps {
  symbol: string;
}

interface NeuralPrediction {
  prediction: string;
  confidence: number;
  probabilities: {
    strong_down: number;
    neutral: number;
    strong_up: number;
  };
}

interface Pattern {
  type: string;
  confidence: number;
  signal: string;
}

interface NeuralData {
  neural_prediction: NeuralPrediction | null;
  pattern_analysis: {
    patterns_detected: any;
    recent_patterns: Pattern[];
    support_resistance: {
      resistance_levels: number[];
      support_levels: number[];
      current_price: number;
    };
    correlations: Record<string, number>;
    volume_analysis: {
      volume_price_correlation: number;
      volume_confirms_trend: boolean;
    };
    divergences: any[];
    overall_sentiment: {
      direction: string;
      confidence: number;
      bullish_signals: number;
      bearish_signals: number;
    };
  };
  correlation_strength: string;
  recommendation: {
    action: string;
    confidence: number;
    reason: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function NeuralInsights({ symbol }: NeuralInsightsProps) {
  const [data, setData] = useState<NeuralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNeuralInsights();
  }, [symbol]);

  const loadNeuralInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/ml/neural/insights/${symbol}`);
      setData(response.data);
    } catch (err: any) {
      console.error('Failed to load neural insights:', err);
      setError(err.response?.data?.detail || 'Failed to load neural insights');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      await axios.post(`${API_URL}/api/ml/neural/train/${symbol}?force_retrain=true`);
      await loadNeuralInsights();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to train model');
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Brain className="h-6 w-6 text-indigo-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Neural Network Insights</h3>
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
          <Brain className="h-6 w-6 text-indigo-500" />
          <h3 className="text-lg font-semibold text-white">Neural Network Insights</h3>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-400 mb-3">{error}</p>
              <button
                onClick={handleTrain}
                disabled={training}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {training ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Training Neural Model...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Train Neural Model</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { neural_prediction, pattern_analysis, correlation_strength, recommendation } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-quantx-darkGrey rounded-lg border border-quantx-green/20 p-6 relative overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-quantx-green/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-quantx-green/10 border border-quantx-green/30">
              <Brain className="h-7 w-7 text-quantx-green" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-mono">Neural Network Analysis</h3>
              <p className="text-sm text-gray-400">Advanced Pattern Recognition & Correlation</p>
            </div>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center space-x-2 px-4 py-2 bg-quantx-mediumGrey border border-quantx-green/30 hover:border-quantx-green hover:shadow-glow-green rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-quantx-green ${training ? 'animate-spin' : ''}`} />
            <span className="text-sm text-quantx-green font-mono">Retrain</span>
          </button>
        </div>

        {/* Neural Prediction */}
        {neural_prediction && (
          <div className="bg-quantx-black/50 border border-quantx-green/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400 font-mono uppercase tracking-wider">Neural Prediction</span>
              <div className="flex items-center space-x-2">
                {neural_prediction.prediction === 'STRONG_UP' ? (
                  <TrendingUp className="h-5 w-5 text-quantx-green" />
                ) : neural_prediction.prediction === 'STRONG_DOWN' ? (
                  <TrendingDown className="h-5 w-5 text-quantx-red" />
                ) : (
                  <Activity className="h-5 w-5 text-quantx-yellow" />
                )}
                <span className={`text-2xl font-bold font-mono ${
                  neural_prediction.prediction === 'STRONG_UP' ? 'text-quantx-green text-glow-green' :
                  neural_prediction.prediction === 'STRONG_DOWN' ? 'text-quantx-red text-glow-red' :
                  'text-quantx-yellow'
                }`}>
                  {neural_prediction.prediction.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* Probability Bars */}
            <div className="space-y-2">
              <ProbabilityBar 
                label="Strong Up" 
                value={neural_prediction.probabilities.strong_up}
                color="green"
              />
              <ProbabilityBar 
                label="Neutral" 
                value={neural_prediction.probabilities.neutral}
                color="yellow"
              />
              <ProbabilityBar 
                label="Strong Down" 
                value={neural_prediction.probabilities.strong_down}
                color="red"
              />
            </div>
            
            <div className="mt-3 text-right">
              <span className="text-xs text-gray-500 font-mono">Confidence: </span>
              <span className="text-lg font-bold text-quantx-cyan font-mono">{(neural_prediction.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Card */}
      <div className={`rounded-lg border p-6 relative overflow-hidden ${getRecommendationStyle(recommendation.action)}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="flex items-start space-x-4 relative">
          <div className={`p-3 rounded-lg ${
            recommendation.action.includes('BUY') ? 'bg-quantx-green/20 border border-quantx-green/40' :
            recommendation.action.includes('SELL') ? 'bg-quantx-red/20 border border-quantx-red/40' :
            'bg-quantx-mediumGrey border border-gray-600'
          }`}>
            <Target className={`h-6 w-6 ${
              recommendation.action.includes('BUY') ? 'text-quantx-green' :
              recommendation.action.includes('SELL') ? 'text-quantx-red' :
              'text-gray-400'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-2 font-mono">Recommended Action</h4>
            <div className="flex items-center space-x-3 mb-3">
              <span className={`text-3xl font-bold font-mono ${
                recommendation.action.includes('BUY') ? 'text-quantx-green text-glow-green' :
                recommendation.action.includes('SELL') ? 'text-quantx-red text-glow-red' :
                'text-gray-400'
              }`}>{recommendation.action}</span>
              <div className="flex-1 bg-quantx-mediumGrey rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    recommendation.action.includes('BUY') ? 'bg-quantx-green shadow-glow-green' :
                    recommendation.action.includes('SELL') ? 'bg-quantx-red shadow-glow-red' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${recommendation.confidence * 100}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-white font-mono">
                {(recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-gray-300">{recommendation.reason}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pattern Analysis */}
        <div className="bg-quantx-darkGrey rounded-lg border border-quantx-blue/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-quantx-blue" />
            <h4 className="text-lg font-semibold text-white font-mono">Pattern Detection</h4>
          </div>
          
          <div className="space-y-3">
            <StatRow 
              label="Total Patterns"
              value={pattern_analysis.patterns_detected.total}
              color="blue"
            />
            <StatRow 
              label="Head & Shoulders"
              value={pattern_analysis.patterns_detected.head_shoulders}
              color="purple"
            />
            <StatRow 
              label="Double Patterns"
              value={pattern_analysis.patterns_detected.double_patterns}
              color="indigo"
            />
            <StatRow 
              label="Triangles"
              value={pattern_analysis.patterns_detected.triangles}
              color="cyan"
            />
          </div>

          {/* Recent Patterns */}
          {pattern_analysis.recent_patterns.length > 0 && (
            <div className="mt-4 p-3 bg-quantx-black/50 border border-quantx-blue/20 rounded-lg">
              <h5 className="text-sm font-semibold text-gray-300 mb-2 font-mono uppercase tracking-wider">Recent Patterns</h5>
              <div className="space-y-2">
                {pattern_analysis.recent_patterns.slice(0, 3).map((pattern, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-mono">
                      {pattern.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded font-mono ${
                      pattern.signal === 'bullish' ? 'bg-quantx-green/10 text-quantx-green border border-quantx-green/30' :
                      pattern.signal === 'bearish' ? 'bg-quantx-red/10 text-quantx-red border border-quantx-red/30' :
                      'bg-quantx-mediumGrey text-gray-400 border border-gray-600'
                    }`}>
                      {pattern.signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market Sentiment */}
        <div className="bg-quantx-darkGrey rounded-lg border border-quantx-green/20 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-quantx-green" />
            <h4 className="text-lg font-semibold text-white font-mono">Market Sentiment</h4>
          </div>
          
          {pattern_analysis.overall_sentiment ? (
            <>
              <div className={`p-4 rounded-lg mb-4 border ${
                pattern_analysis.overall_sentiment.direction === 'BULLISH' ? 'bg-quantx-green/10 border-quantx-green/30' :
                pattern_analysis.overall_sentiment.direction === 'BEARISH' ? 'bg-quantx-red/10 border-quantx-red/30' :
                'bg-quantx-mediumGrey border-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400 font-mono">Overall Direction</span>
                  <span className={`text-2xl font-bold font-mono ${
                    pattern_analysis.overall_sentiment.direction === 'BULLISH' ? 'text-quantx-green text-glow-green' :
                    pattern_analysis.overall_sentiment.direction === 'BEARISH' ? 'text-quantx-red text-glow-red' :
                    'text-gray-400'
                  }`}>
                    {pattern_analysis.overall_sentiment.direction}
                  </span>
                </div>
                <div className="w-full bg-quantx-mediumGrey rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  pattern_analysis.overall_sentiment.direction === 'BULLISH' ? 'bg-quantx-green shadow-glow-green' :
                  pattern_analysis.overall_sentiment.direction === 'BEARISH' ? 'bg-quantx-red shadow-glow-red' :
                  'bg-gray-500'
                }`}
                style={{ width: `${pattern_analysis.overall_sentiment.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-quantx-green/10 border border-quantx-green/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="h-4 w-4 text-quantx-green" />
                <span className="text-xs font-medium text-gray-400 font-mono">Bullish</span>
              </div>
              <span className="text-2xl font-bold text-quantx-green font-mono">
                {pattern_analysis.overall_sentiment.bullish_signals}
              </span>
            </div>
            <div className="p-3 bg-quantx-red/10 border border-quantx-red/30 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingDown className="h-4 w-4 text-quantx-red" />
                <span className="text-xs font-medium text-gray-400 font-mono">Bearish</span>
              </div>
              <span className="text-2xl font-bold text-quantx-red font-mono">
                {pattern_analysis.overall_sentiment.bearish_signals}
              </span>
            </div>
          </div>

          {/* Volume Analysis */}
          {pattern_analysis.volume_analysis && (
            <div className="p-3 bg-quantx-cyan/10 border border-quantx-cyan/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 font-mono">Volume-Price Correlation</span>
                <span className="text-sm font-bold text-quantx-cyan font-mono">
                  {pattern_analysis.volume_analysis.volume_price_correlation.toFixed(2)}
                </span>
              </div>
              {pattern_analysis.volume_analysis.volume_confirms_trend && (
                <div className="flex items-center space-x-1 text-xs text-quantx-green">
                  <CheckCircle className="h-3 w-3" />
                  <span className="font-mono">Volume confirms trend</span>
                </div>
              )}
            </div>
          )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-4 font-mono">
              No sentiment data available
            </div>
          )}
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="bg-quantx-darkGrey rounded-lg border border-quantx-yellow/20 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-quantx-yellow" />
          <h4 className="text-lg font-semibold text-white font-mono">Support & Resistance Levels</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider">Resistance</h5>
            <div className="space-y-1">
              {pattern_analysis.support_resistance.resistance_levels.slice(0, 3).map((level, idx) => (
                <div key={idx} className="p-2 bg-quantx-red/10 border border-quantx-red/30 rounded text-sm">
                  <span className="font-mono font-semibold text-quantx-red">₹{level.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider">Current Price</h5>
            <div className="p-4 bg-quantx-blue/10 border-2 border-quantx-blue/50 rounded-lg text-center shadow-glow-blue">
              <span className="text-2xl font-bold text-quantx-blue font-mono">
                ₹{pattern_analysis.support_resistance.current_price.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2 font-mono uppercase tracking-wider">Support</h5>
            <div className="space-y-1">
              {pattern_analysis.support_resistance.support_levels.slice(0, 3).map((level, idx) => (
                <div key={idx} className="p-2 bg-quantx-green/10 border border-quantx-green/30 rounded text-sm">
                  <span className="font-mono font-semibold text-quantx-green">₹{level.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Strength */}
      <div className="bg-quantx-darkGrey rounded-lg border border-quantx-cyan/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-white mb-1 font-mono">Technical Correlation Strength</h4>
            <p className="text-sm text-gray-400">Measures how well indicators align</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-lg font-mono ${
            correlation_strength === 'VERY_HIGH' ? 'bg-quantx-green/20 text-quantx-green border border-quantx-green/40 shadow-glow-green' :
            correlation_strength === 'HIGH' ? 'bg-quantx-blue/20 text-quantx-blue border border-quantx-blue/40' :
            correlation_strength === 'MODERATE' ? 'bg-quantx-yellow/20 text-quantx-yellow border border-quantx-yellow/40' :
            'bg-quantx-mediumGrey text-gray-400 border border-gray-600'
          }`}>
            {correlation_strength}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ProbabilityBar({ label, value, color }: { label: string; value: number; color: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-quantx-green shadow-glow-green',
    yellow: 'bg-quantx-yellow',
    red: 'bg-quantx-red shadow-glow-red'
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
        <span>{label}</span>
        <span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="w-full bg-quantx-mediumGrey rounded-full h-2">
        <div 
          className={`${colors[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-quantx-blue',
    purple: 'text-purple-400',
    indigo: 'text-indigo-400',
    cyan: 'text-quantx-cyan',
    green: 'text-quantx-green',
    red: 'text-quantx-red'
  };
  
  return (
    <div className="flex items-center justify-between p-2 bg-quantx-black/50 border border-gray-700 rounded">
      <span className="text-sm text-gray-300 font-mono">{label}</span>
      <span className={`text-lg font-bold font-mono ${colorClasses[color] || 'text-white'}`}>{value}</span>
    </div>
  );
}

function getRecommendationStyle(action: string): string {
  if (action.includes('BUY')) return 'bg-quantx-darkGrey border-quantx-green/30';
  if (action.includes('SELL')) return 'bg-quantx-darkGrey border-quantx-red/30';
  return 'bg-quantx-darkGrey border-gray-600';
}
