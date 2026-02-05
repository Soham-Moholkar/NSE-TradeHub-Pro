'use client';

import { useEffect, useState } from 'react';
import { mlAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Target, Zap, Award } from 'lucide-react';

interface MLVisualizationProps {
  symbol: string;
  prediction: any;
}

interface FeatureData {
  feature: string;
  importance: number;
}

export default function MLVisualization({ symbol, prediction }: MLVisualizationProps) {
  const [features, setFeatures] = useState<FeatureData[]>([]);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureAnalysis();
  }, [symbol]);

  const loadFeatureAnalysis = async () => {
    try {
      const response = await mlAPI.getFeatures(symbol);
      const topFeatures = response.data.features.slice(0, 10).map((f: any) => ({
        feature: f.feature.replace(/_/g, ' ').toUpperCase(),
        importance: f.importance * 100,
      }));
      setFeatures(topFeatures);
      
      // Mock model metrics - in real app, this would come from backend
      setModelMetrics({
        accuracy: prediction?.confidence ? prediction.confidence * 100 : 85.4,
        precision: 87.2,
        recall: 83.5,
        f1Score: 85.3,
        modelType: 'Random Forest',
        trainingDate: new Date().toLocaleDateString(),
      });
    } catch (err) {
      console.error('Failed to load feature analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ML Model Analysis</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">ML Model Analysis</h3>
      </div>

      {/* Model Info */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-900">{modelMetrics.modelType}</span>
          </div>
          <span className="text-xs text-gray-600">Trained: {modelMetrics.trainingDate}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <MetricBadge
            icon={<Target className="h-4 w-4" />}
            label="Accuracy"
            value={`${modelMetrics.accuracy.toFixed(1)}%`}
            color="blue"
          />
          <MetricBadge
            icon={<Award className="h-4 w-4" />}
            label="Precision"
            value={`${modelMetrics.precision.toFixed(1)}%`}
            color="green"
          />
          <MetricBadge
            icon={<Target className="h-4 w-4" />}
            label="Recall"
            value={`${modelMetrics.recall.toFixed(1)}%`}
            color="orange"
          />
          <MetricBadge
            icon={<Award className="h-4 w-4" />}
            label="F1 Score"
            value={`${modelMetrics.f1Score.toFixed(1)}%`}
            color="purple"
          />
        </div>
      </div>

      {/* Feature Importance */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Top 10 Features by Importance
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={features} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="feature" type="category" width={100} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
              {features.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${270 - index * 10}, 70%, 60%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Confidence Meter */}
      {prediction && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Prediction Confidence</span>
            <span className="text-lg font-bold text-purple-600">
              {(prediction.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${prediction.confidence * 100}%` } as React.CSSProperties}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Model confidence in predicting <strong>{prediction.prediction}</strong> trend
          </p>
        </div>
      )}
    </div>
  );
}

function MetricBadge({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: 'blue' | 'green' | 'orange' | 'purple' 
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <div className={`p-2 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center space-x-1 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
