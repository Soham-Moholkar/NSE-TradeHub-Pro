'use client';

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  TrendingUp, BarChart2, DollarSign, Users, Bell, 
  Brain, Activity, MessageSquare, Grid3x3, Lock, Unlock,
  Maximize2, Minimize2, X, Loader2
} from 'lucide-react';
import { PriceHistory, MLPrediction } from '@/lib/api';

// Lazy load heavy components
const StockChart = lazy(() => import('@/components/StockChart'));
const PredictionCard = lazy(() => import('@/components/PredictionCard'));
const Watchlist = lazy(() => import('@/components/Watchlist'));
const OrderBook = lazy(() => import('@/components/OrderBook'));
const LivePriceBadge = lazy(() => import('@/components/LivePriceBadge'));
const TechnicalIndicators = lazy(() => import('@/components/TechnicalIndicators'));
const NewsAnalysis = lazy(() => import('@/components/NewsAnalysis'));
const QuickTradePanel = lazy(() => import('@/components/QuickTradePanel'));

// Loading fallback component
const LoadingWidget = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

interface DenseLayoutProps {
  selectedSymbol: string;
  priceData: PriceHistory | null;
  prediction: MLPrediction | null;
  loading: boolean;
  onSelectSymbol: (symbol: string) => void;
  onQuickTrade: (side: 'BUY' | 'SELL', qty: number) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  orderBook?: any;
  livePrice?: any;
}

interface WidgetConfig {
  id: string;
  title: string;
  icon: any;
  component: React.ReactNode;
  minW?: number;
  minH?: number;
}

export default function DenseLayout({
  selectedSymbol,
  priceData,
  prediction,
  loading,
  onSelectSymbol,
  onQuickTrade,
  isLoggedIn,
  onLoginRequired,
  orderBook = null,
  livePrice = null
}: DenseLayoutProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());
  const [loadedWidgets, setLoadedWidgets] = useState<Set<string>>(new Set(['live-price', 'chart']));

  // Stagger widget loading to prevent freezing
  useEffect(() => {
    const widgetsToLoad = ['order-book', 'prediction', 'quick-trade', 'watchlist', 'technical', 'news'];
    let currentIndex = 0;

    const loadNext = () => {
      if (currentIndex < widgetsToLoad.length) {
        setLoadedWidgets(prev => new Set([...prev, widgetsToLoad[currentIndex]]));
        currentIndex++;
        setTimeout(loadNext, 150); // Load next widget after 150ms
      }
    };

    const timer = setTimeout(loadNext, 300); // Start loading after 300ms
    return () => clearTimeout(timer);
  }, []);

  // Default layout configuration
  const defaultLayout: Layout[] = [
    { i: 'live-price', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
    { i: 'chart', x: 0, y: 2, w: 8, h: 8, minW: 4, minH: 6 },
    { i: 'order-book', x: 8, y: 2, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'prediction', x: 0, y: 10, w: 4, h: 6, minW: 3, minH: 5 },
    { i: 'quick-trade', x: 4, y: 10, w: 4, h: 6, minW: 3, minH: 5 },
    { i: 'watchlist', x: 8, y: 10, w: 4, h: 6, minW: 3, minH: 5 },
    { i: 'technical', x: 0, y: 16, w: 8, h: 8, minW: 4, minH: 6 },
    { i: 'news', x: 8, y: 16, w: 4, h: 8, minW: 3, minH: 6 },
  ];

  const [layout, setLayout] = useState<Layout[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-layout');
      return saved ? JSON.parse(saved) : defaultLayout;
    }
    return defaultLayout;
  });

  // Save layout to localStorage
  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-layout', JSON.stringify(newLayout));
    }
  };

  // Reset to default layout
  const resetLayout = () => {
    setLayout(defaultLayout);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-layout', JSON.stringify(defaultLayout));
    }
  };

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  // Memoize widget configurations to prevent recreating on every render
  const widgets: WidgetConfig[] = useMemo(() => [
    {
      id: 'live-price',
      title: 'Live Price',
      icon: TrendingUp,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <LivePriceBadge symbol={selectedSymbol} showDetails={true} />
        </Suspense>
      ),
      minW: 6,
      minH: 2,
    },
    {
      id: 'chart',
      title: 'Price Chart',
      icon: BarChart2,
      component: priceData ? (
        <Suspense fallback={<LoadingWidget />}>
          <StockChart data={priceData} symbol={selectedSymbol} />
        </Suspense>
      ) : <LoadingWidget />,
      minW: 4,
      minH: 6,
    },
    {
      id: 'order-book',
      title: 'Order Book',
      icon: Activity,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <OrderBook orderBook={orderBook} loading={!orderBook} />
        </Suspense>
      ),
      minW: 3,
      minH: 6,
    },
    {
      id: 'prediction',
      title: 'AI Prediction',
      icon: Brain,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <PredictionCard prediction={prediction} symbol={selectedSymbol} loading={loading} />
        </Suspense>
      ),
      minW: 3,
      minH: 5,
    },
    {
      id: 'quick-trade',
      title: 'Quick Trade',
      icon: DollarSign,
      component: priceData?.data.length ? (
        <Suspense fallback={<LoadingWidget />}>
          <QuickTradePanel
            symbol={selectedSymbol}
            currentPrice={priceData.data[priceData.data.length - 1].close}
            onBuy={(qty) => onQuickTrade('BUY', qty)}
            onSell={(qty) => onQuickTrade('SELL', qty)}
            isLoggedIn={isLoggedIn}
            onLoginRequired={onLoginRequired}
          />
        </Suspense>
      ) : <LoadingWidget />,
      minW: 3,
      minH: 5,
    },
    {
      id: 'watchlist',
      title: 'Watchlist',
      icon: Users,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <Watchlist currentSymbol={selectedSymbol} onSelectSymbol={onSelectSymbol} />
        </Suspense>
      ),
      minW: 3,
      minH: 5,
    },
    {
      id: 'technical',
      title: 'Technical Indicators',
      icon: Grid3x3,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <TechnicalIndicators data={priceData} symbol={selectedSymbol} />
        </Suspense>
      ),
      minW: 4,
      minH: 6,
    },
    {
      id: 'news',
      title: 'News & Sentiment',
      icon: MessageSquare,
      component: (
        <Suspense fallback={<LoadingWidget />}>
          <NewsAnalysis symbol={selectedSymbol} />
        </Suspense>
      ),
      minW: 3,
      minH: 6,
    },
  ], [selectedSymbol, priceData, prediction, loading, orderBook, onSelectSymbol, onQuickTrade, isLoggedIn, onLoginRequired]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Dense Pro Layout
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bloomberg Terminal-style workspace • {isLocked ? 'Locked' : 'Unlocked'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Lock/Unlock Toggle */}
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isLocked
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="hidden sm:inline">{isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>

            {/* Reset Layout */}
            <button
              onClick={resetLayout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Widget Toggles */}
            <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2">
              {widgets.slice(1).map((widget) => {
                const Icon = widget.icon;
                const isHidden = hiddenWidgets.has(widget.id);
                return (
                  <button
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isHidden
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}
                    title={widget.title}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div style={{ position: 'relative', width: '100%' }}>
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={40}
            width={1200}
            isDraggable={!isLocked}
            isResizable={!isLocked}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            compactType="vertical"
            preventCollision={false}
            useCSSTransforms={true}
          >
          {widgets.map((widget) => {
            if (hiddenWidgets.has(widget.id)) return null;
            
            // Don't render widget if it hasn't loaded yet
            if (!loadedWidgets.has(widget.id)) return null;
            
            const Icon = widget.icon;
            
            return (
              <div
                key={widget.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
              >
                {/* Widget Header */}
                <div className={`drag-handle flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 ${!isLocked ? 'cursor-move' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {widget.title}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Minimize widget"
                  >
                    <Minimize2 className="w-3 h-3 text-gray-500" />
                  </button>
                </div>

                {/* Widget Content */}
                <div className="flex-1 overflow-auto p-3">
                  {widget.component}
                </div>
              </div>
            );
          })}
        </GridLayout>
        </div>
      </div>

      {/* Helper Text */}
      {!isLocked && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Editing Mode:</strong> Drag widgets by their header to reposition • Drag bottom-right corner to resize • Click minimize icon to hide widgets
          </p>
        </div>
      )}
    </div>
  );
}
