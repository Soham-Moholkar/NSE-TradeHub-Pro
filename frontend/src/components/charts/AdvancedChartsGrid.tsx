'use client';

import React, { useState } from 'react';
import { PriceHistory } from '@/lib/api';
import RenkoChart from './RenkoChart';
import HeikinAshiChart from './HeikinAshiChart';
import PointFigureChart from './PointFigureChart';
import VolumeProfileChart from './VolumeProfileChart';
import VWAPChart from './VWAPChart';
import { BarChart2, TrendingUp, Grid3x3, BarChart3, Activity } from 'lucide-react';

interface AdvancedChartsGridProps {
  data: PriceHistory | null;
  symbol: string;
}

type ChartType = 'renko' | 'heikinashi' | 'pointfigure' | 'volumeprofile' | 'vwap';

export default function AdvancedChartsGrid({ data, symbol }: AdvancedChartsGridProps) {
  const [activeCharts, setActiveCharts] = useState<ChartType[]>(['renko', 'heikinashi']);

  const chartOptions: { type: ChartType; label: string; icon: any; description: string }[] = [
    { 
      type: 'renko', 
      label: 'Renko', 
      icon: Grid3x3,
      description: 'Filters noise, shows pure trend'
    },
    { 
      type: 'heikinashi', 
      label: 'Heikin-Ashi', 
      icon: BarChart2,
      description: 'Smoothed candles for trend clarity'
    },
    { 
      type: 'pointfigure', 
      label: 'Point & Figure', 
      icon: TrendingUp,
      description: 'X/O columns, time-independent'
    },
    { 
      type: 'volumeprofile', 
      label: 'Volume Profile', 
      icon: BarChart3,
      description: 'Horizontal volume distribution'
    },
    { 
      type: 'vwap', 
      label: 'VWAP', 
      icon: Activity,
      description: 'Volume-weighted average price'
    },
  ];

  const toggleChart = (type: ChartType) => {
    if (activeCharts.includes(type)) {
      setActiveCharts(activeCharts.filter(c => c !== type));
    } else {
      setActiveCharts([...activeCharts, type]);
    }
  };

  const renderChart = (type: ChartType) => {
    try {
      switch (type) {
        case 'renko':
          return <RenkoChart key="renko" data={data} symbol={symbol} brickSize={10} />;
        case 'heikinashi':
          return <HeikinAshiChart key="heikinashi" data={data} symbol={symbol} />;
        case 'pointfigure':
          return <PointFigureChart key="pointfigure" data={data} symbol={symbol} boxSize={10} reversalAmount={3} />;
        case 'volumeprofile':
          return <VolumeProfileChart key="volumeprofile" data={data} symbol={symbol} numBins={30} />;
        case 'vwap':
          return <VWAPChart key="vwap" data={data} symbol={symbol} />;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error rendering ${type} chart:`, error);
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <BarChart2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white text-lg mb-2">Chart Unavailable</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Unable to load {type} chart. Try selecting a different stock.</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Selector with iOS Glass */}
      <div className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-3xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Advanced Chart Types
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Select charts to display (max 4 for optimal viewing)
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl backdrop-blur-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-sm">
            {activeCharts.length} active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {chartOptions.map(option => {
            const Icon = option.icon;
            const isActive = activeCharts.includes(option.type);

            return (
              <button
                key={option.type}
                onClick={() => toggleChart(option.type)}
                className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 backdrop-blur-xl ${
                  isActive
                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className={`w-6 h-6 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${
                      isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {isActive && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts Grid */}
      {activeCharts.length === 0 ? (
        <div className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-3xl shadow-xl p-16 border border-white/20 dark:border-gray-700/20 text-center">
          <BarChart2 className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No Charts Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select one or more chart types above to visualize price action
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          activeCharts.length === 1 ? 'grid-cols-1' :
          activeCharts.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
          activeCharts.length === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
          'grid-cols-1 lg:grid-cols-2'
        }`}>
          {activeCharts.map(type => (
            <div key={type} className="backdrop-blur-2xl bg-white/60 dark:bg-gray-900/60 rounded-3xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20">
              {renderChart(type)}
            </div>
          ))}
        </div>
      )}

      {/* Info Panel with iOS Glass */}
      <div className="backdrop-blur-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 dark:from-purple-500/5 dark:via-blue-500/5 dark:to-pink-500/5 rounded-3xl p-8 border border-white/20 dark:border-gray-700/20 shadow-xl">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
          <Activity className="w-6 h-6" />
          Pro Trading Charts Explained
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <strong className="text-gray-900 dark:text-white">Renko:</strong>
            <p className="text-gray-600 dark:text-gray-400">Filters time and volume, focuses purely on price movement. Each brick = fixed price change.</p>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Heikin-Ashi:</strong>
            <p className="text-gray-600 dark:text-gray-400">Smoothed candles using averages. Consecutive same-colored candles = strong trend.</p>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Point & Figure:</strong>
            <p className="text-gray-600 dark:text-gray-400">X's = rising prices, O's = falling. Removes time, shows supply/demand shifts.</p>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Volume Profile:</strong>
            <p className="text-gray-600 dark:text-gray-400">Horizontal histogram showing traded volume at each price level. POC = highest volume.</p>
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">VWAP:</strong>
            <p className="text-gray-600 dark:text-gray-400">Volume-weighted average. Institutional traders use as benchmark. Bands = ±2 std dev.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
