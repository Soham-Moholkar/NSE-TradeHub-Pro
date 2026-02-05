'use client';

import React, { useEffect, useRef } from 'react';
import { PriceHistory } from '@/lib/api';

interface PointFigureChartProps {
  data: PriceHistory | null;
  symbol: string;
  boxSize?: number;
  reversalAmount?: number;
}

interface PFColumn {
  type: 'X' | 'O';
  boxes: number[];
  startIndex: number;
}

export default function PointFigureChart({ 
  data, 
  symbol, 
  boxSize = 10,
  reversalAmount = 3 
}: PointFigureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate P&F columns
    const columns = calculatePointFigure(data.data, boxSize, reversalAmount);
    
    // Draw the chart
    drawPointFigure(ctx, columns, canvas.width, canvas.height, boxSize);

  }, [data, symbol, boxSize, reversalAmount]);

  const calculatePointFigure = (priceData: any[], boxSize: number, reversalAmount: number): PFColumn[] => {
    if (priceData.length === 0) return [];

    const columns: PFColumn[] = [];
    let currentPrice = priceData[0].close;
    let currentColumn: PFColumn | null = null;

    for (let i = 0; i < priceData.length; i++) {
      const high = priceData[i].high;
      const low = priceData[i].low;

      if (!currentColumn) {
        // Start first column
        const startBox = Math.floor(currentPrice / boxSize);
        currentColumn = { type: 'X', boxes: [startBox], startIndex: i };
        columns.push(currentColumn);
        continue;
      }

      const lastBox = currentColumn.boxes[currentColumn.boxes.length - 1];

      if (currentColumn.type === 'X') {
        // Uptrend column
        const newHighBox = Math.floor(high / boxSize);
        
        if (newHighBox > lastBox) {
          // Continue adding X's
          for (let box = lastBox + 1; box <= newHighBox; box++) {
            currentColumn.boxes.push(box);
          }
        } else if ((lastBox * boxSize - low) >= boxSize * reversalAmount) {
          // Reversal to O column
          const newLowBox = Math.floor(low / boxSize);
          currentColumn = { 
            type: 'O', 
            boxes: [],
            startIndex: i 
          };
          for (let box = lastBox - 1; box >= newLowBox; box--) {
            currentColumn.boxes.push(box);
          }
          columns.push(currentColumn);
        }
      } else {
        // Downtrend column
        const newLowBox = Math.floor(low / boxSize);
        
        if (newLowBox < lastBox) {
          // Continue adding O's
          for (let box = lastBox - 1; box >= newLowBox; box--) {
            currentColumn.boxes.push(box);
          }
        } else if ((high - lastBox * boxSize) >= boxSize * reversalAmount) {
          // Reversal to X column
          const newHighBox = Math.floor(high / boxSize);
          currentColumn = { 
            type: 'X', 
            boxes: [],
            startIndex: i 
          };
          for (let box = lastBox + 1; box <= newHighBox; box++) {
            currentColumn.boxes.push(box);
          }
          columns.push(currentColumn);
        }
      }
    }

    return columns;
  };

  const drawPointFigure = (
    ctx: CanvasRenderingContext2D,
    columns: PFColumn[],
    width: number,
    height: number,
    boxSize: number
  ) => {
    if (columns.length === 0) return;

    // Calculate ranges
    const allBoxes = columns.flatMap(col => col.boxes);
    const minBox = Math.min(...allBoxes);
    const maxBox = Math.max(...allBoxes);
    const priceRange = (maxBox - minBox + 1) * boxSize;

    // Drawing parameters
    const columnWidth = Math.min(30, width / (columns.length + 2));
    const boxHeight = height / (maxBox - minBox + 2);
    const padding = 40;

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxBox - minBox; i++) {
      const y = padding + i * boxHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let box = maxBox; box >= minBox; box--) {
      const y = padding + (maxBox - box) * boxHeight + boxHeight / 2;
      ctx.fillText(`₹${(box * boxSize).toFixed(0)}`, padding - 5, y + 4);
    }

    // Draw columns
    columns.forEach((column, colIndex) => {
      const x = padding + colIndex * columnWidth + columnWidth / 2;

      column.boxes.forEach(box => {
        const y = padding + (maxBox - box) * boxHeight + boxHeight / 2;

        if (column.type === 'X') {
          // Draw X
          ctx.strokeStyle = '#26a69a';
          ctx.lineWidth = 2;
          const size = Math.min(columnWidth, boxHeight) * 0.4;
          ctx.beginPath();
          ctx.moveTo(x - size, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.moveTo(x + size, y - size);
          ctx.lineTo(x - size, y + size);
          ctx.stroke();
        } else {
          // Draw O
          ctx.strokeStyle = '#ef5350';
          ctx.lineWidth = 2;
          const radius = Math.min(columnWidth, boxHeight) * 0.4;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    });
  };

  if (!data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Point & Figure Chart - {symbol}
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
            Point & Figure Chart - {symbol}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Box: ₹{boxSize} | Reversal: {reversalAmount} boxes
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-bold text-lg">✕</span>
            <span className="text-gray-600 dark:text-gray-400">Rising prices</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold text-lg">○</span>
            <span className="text-gray-600 dark:text-gray-400">Falling prices</span>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full" style={{ height: '400px' }} />
    </div>
  );
}
