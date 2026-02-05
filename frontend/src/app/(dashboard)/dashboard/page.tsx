'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { symbolsAPI, pricesAPI, mlAPI, tradingAPI, type Symbol, type PriceHistory, type MLPrediction } from '@/lib/api';
import StockChart from '@/components/StockChart';
import PredictionCard from '@/components/PredictionCard';
import StockSearch from '@/components/StockSearch';
import Watchlist from '@/components/Watchlist';
import MarketHeatmap from '@/components/MarketHeatmap';
import MLVisualization from '@/components/MLVisualization';
import TechnicalIndicators from '@/components/TechnicalIndicators';
import CandlestickChart from '@/components/CandlestickChart';
import NewsAnalysis from '@/components/NewsAnalysis';
import CommunityFeed from '@/components/CommunityFeed';
import CreatePost from '@/components/CreatePost';
import AuthModal from '@/components/AuthModal';
import UserProfile from '@/components/UserProfile';
import Communities from '@/components/Communities';
import PostDetail from '@/components/PostDetail';
import UserProfileModal from '@/components/UserProfileModal';
import TradingDashboard from '@/components/TradingDashboard';
import Leaderboard from '@/components/Leaderboard';
import AchievementBadges from '@/components/AchievementBadges';
import StockSidebar from '@/components/StockSidebar';
import QuickTradePanel from '@/components/QuickTradePanel';
import MobileNav from '@/components/MobileNav';
import StockComparison from '@/components/StockComparison';
import PriceAlerts from '@/components/PriceAlerts';
import ExportButton from '@/components/ExportButton';
import NeuralInsights from '@/components/NeuralInsights';
import ThemeToggle from '@/components/ThemeToggle';
import TickerTape from '@/components/TickerTape';
import OrderBook from '@/components/OrderBook';
import LivePriceBadge from '@/components/LivePriceBadge';
import AdvancedChartsGrid from '@/components/charts/AdvancedChartsGrid';
import DenseLayout from '@/components/DenseLayout';
import TradingCommandCenter from '@/components/TradingCommandCenter';
import AITradingAssistant from '@/components/AITradingAssistant';
import ConfettiEffect from '@/components/ConfettiEffect';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';
import { TrendingUp, BarChart3, AlertCircle, Activity, Newspaper, Users, Plus, LogIn, LogOut, User, DollarSign, Brain, GitCompare, Bell, Menu, MessageSquare, Grid3x3, ShoppingCart, Bot } from 'lucide-react';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [priceData, setPriceData] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'technical' | 'ml' | 'portfolio' | 'heatmap' | 'community' | 'trading' | 'news'>('overview');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | null>(null);
  const [tradeMessage, setTradeMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  // Force standard mode only - dense mode temporarily disabled
  const [viewMode, setViewMode] = useState<'standard' | 'dense'>('standard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onTrade: () => setActiveTab('trading'),
    onAI: () => setShowAIAssistant(true),
    onProfile: () => currentUser && setShowProfile(true),
    onDenseMode: () => {}, // Disabled
  });

  // Real-time price data via WebSocket
  const { price: livePrice, orderBook, connected: wsConnected } = useRealtimePrice(selectedSymbol);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      loadStockData(selectedSymbol);
    }
  }, [selectedSymbol]);

  const loadStockData = async (symbol: string) => {
    setLoading(true);
    setError(null);

    try {
      // Load price data
      const priceResponse = await pricesAPI.getHistory(symbol, 365);
      setPriceData(priceResponse.data);

      // Load ML prediction
      try {
        const predictionResponse = await mlAPI.predict(symbol);
        setPrediction(predictionResponse.data);
      } catch (err) {
        console.log('No prediction available, will auto-train');
        setPrediction(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedSymbol) return;

    setLoading(true);
    try {
      await mlAPI.train(selectedSymbol, true);
      // Reload prediction
      const predictionResponse = await mlAPI.predict(selectedSymbol);
      setPrediction(predictionResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const handleAuthSuccess = (token: string, user: any) => {
    setCurrentUser(user);
    setShowAuth(false);
  };

  const handleQuickTrade = async (side: 'BUY' | 'SELL', quantity: number) => {
    if (!currentUser || !priceData) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await tradingAPI.placeOrder({
        symbol: selectedSymbol,
        order_type: 'MARKET',
        side,
        quantity,
      }, token || '');
      
      setTradeMessage({
        type: 'success',
        text: `${side} order for ${quantity} ${selectedSymbol} placed successfully!`
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setTradeMessage(null), 3000);
    } catch (err: any) {
      setTradeMessage({
        type: 'error',
        text: err.response?.data?.detail || `Failed to place ${side} order`
      });
      setTimeout(() => setTradeMessage(null), 5000);
    }
  };

  return (
    <main className="min-h-screen w-full bg-black grid-bg">
      {/* Desktop Header - QuantX Omega Style */}
      <header className="hidden md:block bg-quantx-darkGrey/95 backdrop-blur-sm border-b border-quantx-green/20 sticky top-0 z-40">
        <div className="w-full px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-quantx-green/10 border border-quantx-green/30 rounded-lg animate-pulse-glow">
                <BarChart3 className="h-5 w-5 text-quantx-green" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono">QuantX <span className="text-quantx-green">Omega</span></h1>
                <p className="text-xs text-gray-500 font-mono">Live Market Data & Neural AI Analysis</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Alerts Button */}
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-lg bg-quantx-mediumGrey border border-quantx-green/20 hover:border-quantx-green/50 hover:shadow-glow-green transition-all"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-quantx-red text-white text-[10px] rounded-full flex items-center justify-center font-mono font-medium shadow-glow-red">
                  3
                </span>
              </button>

              {/* Export Button */}
              <ExportButton />

              {/* User Section */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-quantx-mediumGrey border border-quantx-green/20 text-gray-300 rounded-lg hover:border-quantx-green/50 hover:shadow-glow-green transition-all"
                  >
                    <User className="w-4 h-4 text-quantx-green" />
                    <span className="text-sm font-mono">{currentUser.username}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-quantx-red transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-transparent border border-quantx-green text-quantx-green rounded-lg font-mono font-medium hover:bg-quantx-green hover:text-black hover:shadow-glow-green transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        isLoggedIn={!!currentUser}
        username={currentUser?.username}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
      />

      {/* Main Content - Full Width */}
      <div className="w-full px-4 lg:px-6 py-4 pt-16 md:pt-4 pb-20 md:pb-4">
        {/* Search Bar */}
        <div className="mb-4">
          <StockSearch onSelectSymbol={setSelectedSymbol} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-500">Error</h3>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-700 border-t-blue-500"></div>
            <p className="mt-4 text-gray-500">Loading stock data...</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && priceData && (
          <div className="flex gap-6">
            {/* Left Sidebar - Stock Mini Charts */}
            <div className="hidden xl:block flex-shrink-0">
              <StockSidebar 
                selectedSymbol={selectedSymbol}
                onSelectSymbol={(symbol) => {
                  setSelectedSymbol(symbol);
                  setActiveTab('overview');
                }}
              />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Trade Message Toast */}
              {tradeMessage && (
                <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg border ${
                  tradeMessage.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {tradeMessage.text}
                </div>
              )}

              {/* Market Heatmap */}
              <MarketHeatmap 
                onSymbolClick={(symbol) => {
                  setSelectedSymbol(symbol);
                  setActiveTab('overview');
                }}
              />

            {/* Tab Navigation - Desktop Only - QuantX Style */}
            <div className="hidden md:block bg-quantx-darkGrey rounded-lg border border-quantx-green/10 p-1">
              <div className="flex flex-wrap gap-1">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Overview"
                />
                <TabButton
                  active={activeTab === 'charts'}
                  onClick={() => setActiveTab('charts')}
                  icon={<Activity className="h-4 w-4" />}
                  label="Charts"
                />
                <TabButton
                  active={activeTab === 'ml'}
                  onClick={() => setActiveTab('ml')}
                  icon={<Brain className="h-4 w-4" />}
                  label="AI Predictions"
                />
                <TabButton
                  active={activeTab === 'technical'}
                  onClick={() => setActiveTab('technical')}
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Technical"
                />
                <TabButton
                  active={activeTab === 'portfolio'}
                  onClick={() => setActiveTab('portfolio')}
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Portfolio"
                />
                <TabButton
                  active={activeTab === 'trading'}
                  onClick={() => setActiveTab('trading')}
                  icon={<ShoppingCart className="h-4 w-4" />}
                  label="Trading"
                />
                <TabButton
                  active={activeTab === 'heatmap'}
                  onClick={() => setActiveTab('heatmap')}
                  icon={<GitCompare className="h-4 w-4" />}
                  label="Heatmap"
                />
                <TabButton
                  active={activeTab === 'community'}
                  onClick={() => setActiveTab('community')}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Community"
                />
                <TabButton
                  active={activeTab === 'news'}
                  onClick={() => setActiveTab('news')}
                  icon={<Newspaper className="h-4 w-4" />}
                  label="News"
                />
              </div>
            </div>

            {/* Tab Content */}
            {viewMode === 'dense' ? (
              /* Dense Pro Layout - Bloomberg Terminal Style */
              <DenseLayout
                selectedSymbol={selectedSymbol}
                priceData={priceData}
                prediction={prediction}
                loading={loading}
                onSelectSymbol={setSelectedSymbol}
                onQuickTrade={handleQuickTrade}
                isLoggedIn={!!currentUser}
                onLoginRequired={() => setShowAuth(true)}
                orderBook={orderBook}
                livePrice={livePrice}
              />
            ) : (
              /* Standard Tab Views */
              <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  {/* Live Price Badge - Always visible */}
                  <LivePriceBadge 
                    symbol={selectedSymbol}
                    showDetails={true}
                  />
                  
                  <StockChart 
                    data={priceData}
                    symbol={selectedSymbol}
                  />
                  
                  {/* Stats Cards - Responsive Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {priceData.data.length > 0 && (
                      <>
                        <StatCard 
                          label="Latest Close"
                          value={`₹${priceData.data[priceData.data.length - 1].close.toFixed(2)}`}
                          color="blue"
                        />
                        <StatCard 
                          label="Day High"
                          value={`₹${priceData.data[priceData.data.length - 1].high.toFixed(2)}`}
                          color="green"
                        />
                        <StatCard 
                          label="Day Low"
                          value={`₹${priceData.data[priceData.data.length - 1].low.toFixed(2)}`}
                          color="red"
                        />
                        <StatCard 
                          label="Volume"
                          value={formatVolume(priceData.data[priceData.data.length - 1].volume)}
                          color="purple"
                        />
                      </>
                    )}
                  </div>

                  {/* Price Alerts - Mobile Collapsed */}
                  <div className="md:hidden">
                    <PriceAlerts 
                      currentSymbol={selectedSymbol}
                      currentPrice={priceData.data.length > 0 ? priceData.data[priceData.data.length - 1].close : 0}
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4 md:space-y-6">
                  {/* Order Book - Live Data */}
                  <OrderBook 
                    orderBook={orderBook}
                    loading={!wsConnected}
                  />
                  
                  {/* Quick Trade Panel */}
                  {priceData.data.length > 0 && (
                    <QuickTradePanel
                      symbol={selectedSymbol}
                      currentPrice={priceData.data[priceData.data.length - 1].close}
                      onBuy={(qty) => handleQuickTrade('BUY', qty)}
                      onSell={(qty) => handleQuickTrade('SELL', qty)}
                      isLoggedIn={!!currentUser}
                      onLoginRequired={() => setShowAuth(true)}
                    />
                  )}

                  {/* Prediction Card */}
                  <PredictionCard 
                    prediction={prediction}
                    symbol={selectedSymbol}
                    loading={loading}
                  />

                  {/* Watchlist - Hidden on mobile */}
                  <div className="hidden md:block">
                    <Watchlist 
                      currentSymbol={selectedSymbol}
                      onSelectSymbol={setSelectedSymbol}
                    />
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-6">
                <NewsAnalysis symbol={selectedSymbol} />
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-4 md:space-y-6">
                {/* Traditional Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <CandlestickChart
                      data={priceData}
                      symbol={selectedSymbol}
                    />
                    <StockChart 
                      data={priceData}
                      symbol={selectedSymbol}
                    />
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    <PredictionCard 
                      prediction={prediction}
                      symbol={selectedSymbol}
                      loading={loading}
                    />
                    <Watchlist 
                      currentSymbol={selectedSymbol}
                      onSelectSymbol={setSelectedSymbol}
                    />
                  </div>
                </div>

                {/* Advanced Professional Charts */}
                <AdvancedChartsGrid 
                  data={priceData}
                  symbol={selectedSymbol}
                />
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2">
                  <TechnicalIndicators
                    data={priceData}
                    symbol={selectedSymbol}
                  />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <PredictionCard 
                    prediction={prediction}
                    symbol={selectedSymbol}
                    loading={loading}
                  />
                  <div className="hidden md:block">
                    <Watchlist 
                      currentSymbol={selectedSymbol}
                      onSelectSymbol={setSelectedSymbol}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ml' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                  <MLVisualization
                    symbol={selectedSymbol}
                    prediction={prediction}
                  />
                  <CandlestickChart
                    data={priceData}
                    symbol={selectedSymbol}
                  />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <PredictionCard 
                    prediction={prediction}
                    symbol={selectedSymbol}
                    loading={loading}
                  />
                  
                  {/* Neural Insights - Always On */}
                  <NeuralInsights symbol={selectedSymbol} />
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div>
                {!currentUser ? (
                  <div className="text-center py-16 bg-quantx-darkGrey rounded-lg border border-quantx-green/20">
                    <div className="w-16 h-16 mx-auto mb-4 bg-quantx-green/10 rounded-full flex items-center justify-center border border-quantx-green/30">
                      <DollarSign className="h-8 w-8 text-quantx-green" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 font-mono">
                      Paper Trading Platform
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Sign in to start paper trading with virtual ₹100,000
                    </p>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="bg-transparent border border-quantx-green text-quantx-green px-6 py-2.5 rounded-lg font-mono font-medium hover:bg-quantx-green hover:text-black hover:shadow-glow-green transition-all"
                    >
                      Sign In to Trade
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    <TradingDashboard />
                    
                    {/* Leaderboard & Achievements */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <Leaderboard />
                      <AchievementBadges />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trading' && (
              <div>
                {!currentUser ? (
                  <div className="text-center py-16 bg-quantx-darkGrey rounded-lg border border-quantx-blue/20">
                    <div className="w-16 h-16 mx-auto mb-4 bg-quantx-blue/10 rounded-full flex items-center justify-center border border-quantx-blue/30">
                      <ShoppingCart className="h-8 w-8 text-quantx-blue" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 font-mono">
                      Trading Command Center
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Sign in to access advanced order management
                    </p>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="bg-transparent border border-quantx-blue text-quantx-blue px-6 py-2.5 rounded-lg font-mono font-medium hover:bg-quantx-blue hover:text-black hover:shadow-glow-blue transition-all"
                    >
                      Sign In to Trade
                    </button>
                  </div>
                ) : (
                  <TradingCommandCenter />
                )}
              </div>
            )}

            {activeTab === 'heatmap' && (
              <div className="space-y-4 md:space-y-6">
                <MarketHeatmap 
                  onSymbolClick={(symbol) => {
                    setSelectedSymbol(symbol);
                    setActiveTab('overview');
                  }}
                />
                <StockComparison />
              </div>
            )}

            {activeTab === 'community' && (
              <div className="space-y-4 md:space-y-6">
                {/* Community Feed + Communities Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <CommunityFeed 
                      onPostClick={(postId) => setSelectedPostId(postId)}
                      currentUser={currentUser}
                      selectedCommunity={selectedCommunity}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <Communities 
                      selectedCommunity={selectedCommunity}
                      onCommunitySelect={setSelectedCommunity}
                    />
                  </div>
                </div>

                {/* Floating Action Button - Create Post */}
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="fixed bottom-6 right-6 w-12 h-12 bg-quantx-darkGrey border border-quantx-green/50 text-quantx-green rounded-full shadow-glow-green flex items-center justify-center transition-all hover:border-quantx-green hover:bg-quantx-green/10 z-50"
                  aria-label="Create Post"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            )}
            </>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={() => {
            setShowCreatePost(false);
          }}
          defaultCommunity={selectedCommunity}
        />
      )}

      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          currentUser={currentUser}
        />
      )}

      {selectedUserProfile && (
        <UserProfileModal
          username={selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showProfile && currentUser && (
        <UserProfile
          username={currentUser.username}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Price Alerts Slide-out Panel */}
      {showAlerts && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowAlerts(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 animate-slideIn">
            <div className="h-full bg-[#0d0d0d] border-l border-[#262626] overflow-y-auto">
              <div className="sticky top-0 bg-[#0d0d0d] border-b border-[#262626] p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Price Alerts</h2>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                >
                  <span className="text-gray-400">✕</span>
                </button>
              </div>
              <div className="p-4">
                <PriceAlerts 
                  currentSymbol={selectedSymbol}
                  currentPrice={priceData?.data.length ? priceData.data[priceData.data.length - 1].close : 0}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ticker Tape - Live Market Data at Bottom */}
      <TickerTape speed={50} />

      {/* Confetti Effect */}
      <ConfettiEffect 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)}
        duration={4000}
      />

      {/* AI Trading Assistant */}
      <AITradingAssistant 
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />

      {/* Floating AI Assistant Button */}
      {currentUser && !showAIAssistant && (
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-20 right-6 w-12 h-12 bg-quantx-darkGrey border border-quantx-cyan/50 text-quantx-cyan rounded-full shadow-glow-cyan flex items-center justify-center transition-all hover:border-quantx-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] z-40"
          title="AI Trading Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </main>
  );
}

// Helper Components
function TabButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md font-mono font-medium transition-all ${
        active
          ? 'bg-quantx-green/20 text-quantx-green border border-quantx-green/40 shadow-glow-green'
          : 'text-gray-400 hover:text-quantx-green hover:bg-quantx-mediumGrey border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline text-sm">{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, { text: string; border: string; glow: string }> = {
    blue: { text: 'text-quantx-blue', border: 'border-quantx-blue/30', glow: 'hover:shadow-glow-blue' },
    green: { text: 'text-quantx-green', border: 'border-quantx-green/30', glow: 'hover:shadow-glow-green' },
    red: { text: 'text-quantx-red', border: 'border-quantx-red/30', glow: 'hover:shadow-glow-red' },
    purple: { text: 'text-purple-400', border: 'border-purple-500/30', glow: '' },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-3 rounded-lg bg-quantx-darkGrey border ${styles.border} ${styles.glow} transition-all`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">{label}</p>
      <p className={`text-lg font-semibold mt-1 font-mono ${styles.text}`}>{value}</p>
    </div>
  );
}

function formatVolume(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    return `${(value / 100000).toFixed(2)}L`;
  }
  return value.toString();
}

