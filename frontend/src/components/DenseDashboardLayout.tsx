'use client';

import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { PriceHistory } from '@/lib/api';
import { OrderBook as OrderBookType } from '@/hooks/useRealtimePrice';
import { TrendingUp, BarChart3, Activity, Users, DollarSign, Brain, PieChart, Loader2 } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Lazy load heavy components
const StockChart = lazy(() => import('./StockChart'));
const OrderBook = lazy(() => import('./OrderBook'));
const TechnicalIndicators = lazy(() => import('./TechnicalIndicators'));
const Watchlist = lazy(() => import('./Watchlist'));
const QuickTradePanel = lazy(() => import('./QuickTradePanel'));
const NeuralInsights = lazy(() => import('./NeuralInsights'));
const MarketHeatmap = lazy(() => import('./MarketHeatmap'));
const LivePriceBadge = lazy(() => import('./LivePriceBadge'));

const ResponsiveGridLayout = WidthProvider(Responsive);

// Loading fallback
const LoadingWidget = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

interface DenseDashboardLayoutProps {
  symbol: string;
  priceData: PriceHistory | null;
  orderBook: OrderBookType | null;
  wsConnected: boolean;
  onSymbolChange: (symbol: string) => void;
}

export default function DenseDashboardLayout({
  symbol,
  priceData,
  orderBook,
  wsConnected,
  onSymbolChange
}: DenseDashboardLayoutProps) {
  const defaultLayout: Layout[] = useMemo(() => [
    { i: 'price', x: 0, y: 0, w: 12, h: 2, minW: 4, minH: 2 },
    { i: 'chart', x: 0, y: 2, w: 8, h: 6, minW: 6, minH: 4 },
    { i: 'orderbook', x: 8, y: 2, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'technical', x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'watchlist', x: 6, y: 8, w: 3, h: 5, minW: 3, minH: 4 },
    { i: 'trade', x: 9, y: 8, w: 3, h: 5, minW: 3, minH: 4 },
    { i: 'neural', x: 0, y: 13, w: 6, h: 6, minW: 4, minH: 5 },
    { i: 'heatmap', x: 6, y: 13, w: 6, h: 6, minW: 4, minH: 5 },
  ], []);

  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('denseDashboardLayout');
      return saved ? JSON.parse(saved) : { lg: defaultLayout };
    }
    return { lg: defaultLayout };
  });

  const handleLayoutChange = (layout: Layout[], layouts: any) => {
    setLayouts(layouts);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('denseDashboardLayout', JSON.stringify(layouts));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 overflow-hidden pt-16">
      <ResponsiveGridLayout
        className="h-full"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={50}
        isDraggable={true}
        isResizable={true}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[8, 8]}
        containerPadding={[8, 8]}
      >
        {/* Live Price Widget */}
        <div key="price" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">LIVE PRICE</span>
            <TrendingUp className="w-3 h-3" />
          </div>
          <div className="flex-1 p-2 overflow-hidden flex items-center justify-center">
            <Suspense fallback={<LoadingWidget />}>
              <LivePriceBadge symbol={symbol} showDetails={true} className="w-full" />
            </Suspense>
          </div>
        </div>

        {/* Main Chart Widget */}
        <div key="chart" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">PRICE CHART</span>
            <BarChart3 className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <Suspense fallback={<LoadingWidget />}>
              {priceData && <StockChart data={priceData} symbol={symbol} />}
            </Suspense>
          </div>
        </div>

        {/* Order Book Widget */}
        <div key="orderbook" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">ORDER BOOK</span>
            <Activity className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto">
            <Suspense fallback={<LoadingWidget />}>
              <OrderBook orderBook={orderBook} loading={!wsConnected} />
            </Suspense>
          </div>
        </div>

        {/* Technical Indicators Widget */}
        <div key="technical" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">TECHNICAL</span>
            <Activity className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Suspense fallback={<LoadingWidget />}>
              <TechnicalIndicators data={priceData} symbol={symbol} />
            </Suspense>
          </div>
        </div>

        {/* Watchlist Widget */}
        <div key="watchlist" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">WATCHLIST</span>
            <Users className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto">
            <Suspense fallback={<LoadingWidget />}>
              <Watchlist currentSymbol={symbol} onSelectSymbol={onSymbolChange} />
            </Suspense>
          </div>
        </div>

        {/* Quick Trade Widget */}
        <div key="trade" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">QUICK TRADE</span>
            <DollarSign className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Suspense fallback={<LoadingWidget />}>
              <QuickTradePanel
                symbol={symbol}
                currentPrice={priceData?.data[priceData.data.length - 1]?.close || 0}
                onBuy={(qty) => console.log('Buy', qty)}
                onSell={(qty) => console.log('Sell', qty)}
                isLoggedIn={true}
                onLoginRequired={() => {}}
              />
            </Suspense>
          </div>
        </div>

        {/* Neural Insights Widget */}
        <div key="neural" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">AI INSIGHTS</span>
            <Brain className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Suspense fallback={<LoadingWidget />}>
              <NeuralInsights symbol={symbol} />
            </Suspense>
          </div>
        </div>

        {/* Market Heatmap Widget */}
        <div key="heatmap" className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="drag-handle bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 cursor-move flex items-center justify-between">
            <span className="text-xs font-semibold">MARKET HEATMAP</span>
            <PieChart className="w-3 h-3" />
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Suspense fallback={<LoadingWidget />}>
              <MarketHeatmap onSymbolClick={onSymbolChange} />
            </Suspense>
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
