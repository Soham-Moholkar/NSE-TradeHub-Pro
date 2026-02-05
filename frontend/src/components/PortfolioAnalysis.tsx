'use client';

import { useState, useEffect } from 'react';
import { tradingAPI, PortfolioAnalysis as PortfolioAnalysisType, api } from '@/lib/api';
import { Activity, AlertTriangle, TrendingUp, Shield, Target, RefreshCw } from 'lucide-react';

interface PortfolioAnalysisProps {
  portfolioId: number;
}

export default function PortfolioAnalysis({ portfolioId }: PortfolioAnalysisProps) {
  const [analysis, setAnalysis] = useState<PortfolioAnalysisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await tradingAPI.getAnalysis();
      setAnalysis(response.data);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      loadAnalysis();
    }
  }, [portfolioId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 65) return 'text-lime-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 35) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'Moderate':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'High':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-red-500 bg-red-500/10 border-red-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-500/5';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-500/5';
      default:
        return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          AI Analysis
        </h3>
        <button
          onClick={loadAnalysis}
          disabled={loading}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Health Score */}
      <div className="mb-6 p-4 bg-gray-700/50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Portfolio Health</span>
          <span className={`text-2xl font-bold ${getHealthColor(analysis.health_score)}`}>
            {analysis.health_score.toFixed(0)}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              analysis.health_score >= 80 ? 'bg-green-500' :
              analysis.health_score >= 65 ? 'bg-lime-500' :
              analysis.health_score >= 50 ? 'bg-yellow-500' :
              analysis.health_score >= 35 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${analysis.health_score}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-gray-300">
          {analysis.health_status}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className={`mb-6 p-4 border rounded-md ${getRiskColor(analysis.risk_assessment.overall_risk)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-semibold">Risk Level</span>
          </div>
          <span className="font-bold">{analysis.risk_assessment.overall_risk}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mt-3">
          <div>
            <div className="text-gray-400">Volatility</div>
            <div className="font-semibold">{analysis.risk_assessment.volatility.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-400">Beta</div>
            <div className="font-semibold">{analysis.risk_assessment.beta.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Diversification */}
      <div className="mb-6 p-4 bg-gray-700/50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-gray-200">Diversification</span>
          </div>
          <span className="text-sm font-bold text-gray-200">
            {analysis.diversification.score.toFixed(0)}/100
          </span>
        </div>
        <div className="text-xs text-gray-400 mb-2">
          {analysis.diversification.status}
        </div>
        <div className="text-xs text-gray-500">
          {analysis.diversification.position_count} positions • {analysis.diversification.concentration_risk}
        </div>
      </div>

      {/* Top Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Top Recommendations
          </h4>
          {analysis.recommendations.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {expanded ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {(expanded ? analysis.recommendations : analysis.recommendations.slice(0, 3)).map((rec, idx) => (
            <div
              key={idx}
              className={`border-l-4 p-3 rounded ${getPriorityColor(rec.priority)}`}
            >
              <div className="font-semibold text-sm text-gray-200 mb-1">
                {rec.title}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {rec.description}
              </div>
              <div className="text-xs text-blue-400 font-medium">
                → {rec.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Allocation (if expanded) */}
      {expanded && analysis.sector_allocation.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="font-semibold text-gray-200 mb-3">Sector Allocation</h4>
          <div className="space-y-2">
            {analysis.sector_allocation.map((sector, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{sector.sector}</span>
                  <span className="text-gray-200 font-semibold">{sector.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${sector.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
