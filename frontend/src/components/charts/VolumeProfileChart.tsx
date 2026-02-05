'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, HistogramData } from 'lightweight-charts';
import { PriceHistory } from '@/lib/api';

interface VolumeProfileChartProps {
  data: PriceHistory | null;
  symbol: string;
  numBins?: number;
}

export default function VolumeProfileChart({ data, symbol, numBins = 20 }: VolumeProfileChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const profileCanvasRef = useRef<HTMLCanvasElement>(null);

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
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
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

    const candleData = cleanData.map(d => ({
      time: new Date(d.date).getTime() / 1000 as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(candleData);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    const volumeData: HistogramData[] = cleanData.map(d => ({
      time: new Date(d.date).getTime() / 1000 as any,
      value: d.volume,
      color: d.close >= d.open ? '#26a69a80' : '#ef535080',
    }));

    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    // Draw volume profile on canvas
    drawVolumeProfile(cleanData, numBins);

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
        drawVolumeProfile(cleanData, numBins);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, symbol, numBins]);

  const drawVolumeProfile = (priceData: any[], bins: number) => {
    const canvas = profileCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 400;

    // Calculate price range
    const prices = priceData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const binSize = priceRange / bins;

    // Create bins
    const volumeBins: { price: number; volume: number }[] = [];
    for (let i = 0; i < bins; i++) {
      volumeBins.push({
        price: minPrice + i * binSize + binSize / 2,
        volume: 0,
      });
    }

    // Accumulate volume in bins
    priceData.forEach(d => {
      const binIndex = Math.min(
        Math.floor((d.close - minPrice) / binSize),
        bins - 1
      );
      if (binIndex >= 0 && binIndex < bins) {
        volumeBins[binIndex].volume += d.volume;
      }
    });

    // Find max volume for scaling
    const maxVolume = Math.max(...volumeBins.map(b => b.volume));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw volume profile bars (horizontal)
    const barHeight = canvas.height / bins;
    
    volumeBins.forEach((bin, index) => {
      const barWidth = (bin.volume / maxVolume) * (canvas.width - 60);
      const y = canvas.height - (index + 1) * barHeight;

      // Draw bar
      ctx.fillStyle = '#4f46e580';
      ctx.fillRect(0, y, barWidth, barHeight - 1);

      // Draw price label
      if (index % 3 === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`₹${bin.price.toFixed(0)}`, canvas.width - 5, y + barHeight / 2 + 3);
      }
    });

    // Find POC (Point of Control - highest volume)
    const pocBin = volumeBins.reduce((max, bin) => 
      bin.volume > max.volume ? bin : max
    );
    const pocY = canvas.height - (volumeBins.indexOf(pocBin) + 1) * barHeight + barHeight / 2;

    // Draw POC line
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(0, pocY);
    ctx.lineTo(canvas.width - 60, pocY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Volume Profile - {symbol}
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
            Volume Profile - {symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Horizontal volume distribution with POC
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500/50 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Volume</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-600 dark:text-gray-400">POC</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div ref={chartContainerRef} className="flex-1" />
        <canvas 
          ref={profileCanvasRef} 
          className="border-l border-gray-200 dark:border-gray-700"
          style={{ width: '200px', height: '400px' }}
        />
      </div>
    </div>
  );
}
