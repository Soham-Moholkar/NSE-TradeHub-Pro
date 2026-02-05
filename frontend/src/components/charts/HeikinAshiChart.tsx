'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { PriceHistory } from '@/lib/api';

interface HeikinAshiChartProps {
  data: PriceHistory | null;
  symbol: string;
}

export default function HeikinAshiChart({ data, symbol }: HeikinAshiChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || !data.data || data.data.length === 0) return;

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');

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

    // Calculate Heikin-Ashi candles
    const heikinAshiData = calculateHeikinAshi(data.data);
    
    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    seriesRef.current = series;
    series.setData(heikinAshiData);

    chart.timeScale().fitContent();

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
  }, [data, symbol]);

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

  const calculateHeikinAshi = (priceData: any[]): CandlestickData[] => {
    if (priceData.length === 0) return [];

    // Sort and deduplicate first
    const cleanData = sortAndDeduplicateData(priceData);

    const haData: CandlestickData[] = [];
    let prevHA = {
      open: cleanData[0].open,
      close: (cleanData[0].open + cleanData[0].high + cleanData[0].low + cleanData[0].close) / 4,
    };

    for (let i = 0; i < cleanData.length; i++) {
      const candle = cleanData[i];
      
      // Heikin-Ashi calculations
      const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
      const haOpen = (prevHA.open + prevHA.close) / 2;
      const haHigh = Math.max(candle.high, haOpen, haClose);
      const haLow = Math.min(candle.low, haOpen, haClose);

      haData.push({
        time: new Date(candle.date).getTime() / 1000 as any,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
      });

      prevHA = { open: haOpen, close: haClose };
    }

    return haData;
  };

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Heikin-Ashi Chart - {symbol}
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
            Heikin-Ashi Chart - {symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Smoothed candles for trend identification
          </p>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
          <div>Green = Strong uptrend</div>
          <div>Red = Strong downtrend</div>
          <div>Small bodies = Consolidation</div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
