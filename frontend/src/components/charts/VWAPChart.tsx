'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { PriceHistory } from '@/lib/api';

interface VWAPChartProps {
  data: PriceHistory | null;
  symbol: string;
}

export default function VWAPChart({ data, symbol }: VWAPChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const upperBandRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lowerBandRef = useRef<ISeriesApi<'Line'> | null>(null);

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

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candleSeriesRef.current = candleSeries;

    // Sort and deduplicate data
    const sortedData = [...data.data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const uniqueMap = new Map();
    sortedData.forEach(item => {
      const timestamp = new Date(item.date).getTime() / 1000;
      uniqueMap.set(timestamp, item);
    });
    
    const cleanData = Array.from(uniqueMap.values());

    const candleData: CandlestickData[] = cleanData.map(d => ({
      time: new Date(d.date).getTime() / 1000 as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(candleData);

    // Calculate VWAP
    const vwapData = calculateVWAP(cleanData);
    
    // Add VWAP line
    const vwapSeries = chart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      title: 'VWAP',
    });

    vwapSeriesRef.current = vwapSeries;
    vwapSeries.setData(vwapData.vwap);

    // Add upper band
    const upperBand = chart.addLineSeries({
      color: '#f4511e',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: 'Upper Band',
    });

    upperBandRef.current = upperBand;
    upperBand.setData(vwapData.upperBand);

    // Add lower band
    const lowerBand = chart.addLineSeries({
      color: '#00897b',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: 'Lower Band',
    });

    lowerBandRef.current = lowerBand;
    lowerBand.setData(vwapData.lowerBand);

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

  const calculateVWAP = (priceData: any[]) => {
    const vwap: LineData[] = [];
    const upperBand: LineData[] = [];
    const lowerBand: LineData[] = [];

    let cumulativePV = 0;
    let cumulativeVolume = 0;
    let cumulativeSquaredDiff = 0;

    priceData.forEach((d, index) => {
      const typicalPrice = (d.high + d.low + d.close) / 3;
      const pv = typicalPrice * d.volume;
      
      cumulativePV += pv;
      cumulativeVolume += d.volume;
      
      const vwapValue = cumulativePV / cumulativeVolume;
      const time = new Date(d.date).getTime() / 1000 as any;

      // Calculate standard deviation
      const squaredDiff = Math.pow(typicalPrice - vwapValue, 2) * d.volume;
      cumulativeSquaredDiff += squaredDiff;
      const variance = cumulativeSquaredDiff / cumulativeVolume;
      const stdDev = Math.sqrt(variance);

      vwap.push({ time, value: vwapValue });
      upperBand.push({ time, value: vwapValue + 2 * stdDev });
      lowerBand.push({ time, value: vwapValue - 2 * stdDev });
    });

    return { vwap, upperBand, lowerBand };
  };

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          VWAP Chart - {symbol}
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
            VWAP Chart - {symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Volume Weighted Average Price with ±2σ bands
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">VWAP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-red-600" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Upper</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-green-600" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Lower</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-gray-700 dark:text-gray-300">
          <strong>Trading Strategy:</strong> Price above VWAP = Bullish bias | Price below VWAP = Bearish bias | 
          Bands show ±2 standard deviations for overbought/oversold zones
        </p>
      </div>
    </div>
  );
}
