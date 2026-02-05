'use client';

import { type MLPrediction } from '@/lib/api';
import { TrendingUp, TrendingDown, Brain } from 'lucide-react';

interface PredictionCardProps {
  prediction: MLPrediction | null;
  symbol: string;
  loading: boolean;
}

export default function PredictionCard({ prediction, symbol, loading }: PredictionCardProps) {
  if (loading) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-purple-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white">ML Prediction</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Generating prediction for {symbol}...</p>
          <p className="text-sm text-gray-500 mt-2">Training model with latest data</p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-6 w-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">ML Prediction</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-400">Unable to generate prediction</p>
          <p className="text-sm text-gray-500 mt-2">Please try another stock</p>
        </div>
      </div>
    );
  }

  const isUp = prediction.prediction === 'UP';
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className="bg-[#121212] rounded-lg border border-[#262626] p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-6 w-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-white">ML Prediction</h3>
      </div>

      <div className={`${isUp ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-lg p-6 mb-4`}>
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Icon className={`h-12 w-12 ${isUp ? 'text-green-500' : 'text-red-500'}`} />
          <div className="text-center">
            <div className={`text-3xl font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              {prediction.prediction}
            </div>
            <div className="text-sm text-gray-400">Next Day Trend</div>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <div className="text-sm text-gray-400">Confidence</div>
          <div className="text-2xl font-bold text-white">
            {(prediction.confidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm">
          <span className="text-gray-500">Based on:</span>
          <span className="font-medium text-white"> Technical Indicators</span>
        </div>
        
        {prediction.features && Object.keys(prediction.features).length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-400 mb-2">Top Features:</div>
            <div className="space-y-1">
              {Object.entries(prediction.features).slice(0, 5).map(([feature, value]) => (
                <div key={feature} className="flex justify-between text-xs">
                  <span className="text-gray-500">{feature}</span>
                  <span className="font-medium text-gray-300">{value.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#262626] text-xs text-gray-500">
          Predicted at: {new Date(prediction.predicted_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
