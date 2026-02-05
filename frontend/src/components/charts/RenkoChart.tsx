'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { PriceHistory } from '@/lib/api';

interface RenkoChartProps {
  data: PriceHistory | null;
  symbol: string;
  brickSize?: number;
}

export default function RenkoChart({ data, symbol, brickSize = 10 }: RenkoChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || !data.data || data.data.length === 0) return;

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: isDark ? '#1e293b' : '#ffffff' },
        textColor: isDark ? '#e2e8f0' : '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Convert price data to Renko bricks
    const renkoData = calculateRenkoBricks(data.data, brickSize);
    
    // Create candlestick series for Renko bricks
    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    seriesRef.current = series;
    series.setData(renkoData);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, symbol, brickSize]);

  // Sort and deduplicate data by timestamp
  const sortAndDeduplicateData = (priceData: any[]): any[] => {
    // Sort by date ascending
    const sorted = [...priceData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Remove duplicates (keep last entry for same timestamp)
    const uniqueMap = new Map();
    sorted.forEach(item => {
      const timestamp = new Date(item.date).getTime();
      uniqueMap.set(timestamp, item);
    });
    
    return Array.from(uniqueMap.values());
  };

  // Calculate Renko bricks from price data
  const calculateRenkoBricks = (priceData: any[], brickSize: number): CandlestickData[] => {
    if (priceData.length === 0) return [];

    // Sort and deduplicate first
    const cleanData = sortAndDeduplicateData(priceData);

    const bricks: CandlestickData[] = [];
    let currentBrickPrice = Math.floor(cleanData[0].close / brickSize) * brickSize;
    let brickTime = new Date(cleanData[0].date).getTime() / 1000;

    for (let i = 0; i < cleanData.length; i++) {
      const price = cleanData[i].close;

      // Calculate how many bricks should be formed
      const priceDiff = price - currentBrickPrice;
      const numBricks = Math.floor(Math.abs(priceDiff) / brickSize);

      if (numBricks > 0) {
        const direction = priceDiff > 0 ? 1 : -1;

        for (let j = 0; j < numBricks; j++) {
          const brickOpen = currentBrickPrice;
          const brickClose = currentBrickPrice + (direction * brickSize);

          bricks.push({
            time: (brickTime + j) as any,
            open: brickOpen,
            high: Math.max(brickOpen, brickClose),
            low: Math.min(brickOpen, brickClose),
            close: brickClose,
          });

          currentBrickPrice = brickClose;
        }
        
        brickTime += numBricks;
      }
    }

    return bricks;
  };

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Renko Chart - {symbol}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Renko Chart - {symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Brick Size: ₹{brickSize} | Filters noise, shows trends
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Bearish</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
