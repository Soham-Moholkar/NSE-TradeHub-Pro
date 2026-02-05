import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Symbol {
  symbol: string;
  company_name: string;
  sector?: string;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceHistory {
  symbol: string;
  data: PriceData[];
  period: string;
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  company_name: string;
  sector?: string;
  notes?: string;
  added_at: string;
  current_price?: number;
  change_percent?: number;
}

export interface MLPrediction {
  symbol: string;
  prediction: string;
  confidence: number;
  predicted_at: string;
  features: Record<string, number>;
}

export interface MLFeatureImportance {
  feature: string;
  importance: number;
}

// Additional types
export interface PopularSymbolsResponse {
  symbols: Symbol[];
  count: number;
}

export interface MLFeatureAnalysis {
  symbol: string;
  features: MLFeatureImportance[];
  latest_features: Record<string, number>;
}

// API functions
export const symbolsAPI = {
  getPopular: () => api.get<PopularSymbolsResponse>('/api/symbols/popular'),
  search: (query: string) => api.get<Symbol[]>(`/api/symbols/search?q=${query}`),
  getDetails: (symbol: string) => api.get(`/api/symbols/${symbol}`),
};

export const pricesAPI = {
  getHistory: (symbol: string, days: number = 365) => 
    api.get<PriceHistory>(`/api/prices/${symbol}?days=${days}&source=synthetic`),
  getLatest: (symbol: string) => api.get(`/api/prices/${symbol}/latest?source=synthetic`),
};

export const watchlistAPI = {
  getAll: () => api.get<WatchlistItem[]>('/api/watchlist'),
  add: (symbol: string, notes?: string) => 
    api.post('/api/watchlist', { symbol, notes }),
  remove: (symbol: string) => api.delete(`/api/watchlist/${symbol}`),
};

export const mlAPI = {
  predict: (symbol: string) => api.get<MLPrediction>(`/api/ml/predict/${symbol}`),
  train: (symbol: string, forceRetrain: boolean = false) => 
    api.post(`/api/ml/train/${symbol}`, { force_retrain: forceRetrain }),
  getFeatures: (symbol: string) => api.get<MLFeatureAnalysis>(`/api/ml/features/${symbol}`),
};

// Trading types
export interface Portfolio {
  id: number;
  cash_balance: number;
  total_value: number;
  total_returns: number;
  returns_percentage: number;
  health_score?: number;
  diversification_score?: number;
}

export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price?: number;
  current_value?: number;
  invested_amount: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  sector?: string;
}

export interface Order {
  id: number;
  symbol: string;
  order_type: string;
  side: string;
  quantity: number;
  limit_price?: number;
  status: string;
  filled_price?: number;
  created_at: string;
  filled_at?: string;
}

export interface Transaction {
  id: number;
  symbol?: string;
  transaction_type: string;
  quantity?: number;
  price?: number;
  total_amount: number;
  fees: number;
  notes?: string;
  created_at: string;
}

export interface TradingSignal {
  signal: string;
  strength: number;
  confidence: number;
  current_price: number;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  generated_at: string;
}

export interface PortfolioAnalysis {
  health_score: number;
  health_status: string;
  diversification: {
    score: number;
    status: string;
    position_count: number;
    concentration_risk: string;
  };
  sector_allocation: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
  risk_assessment: {
    overall_risk: string;
    risk_score: number;
    volatility: number;
    beta: number;
    risk_factors: string[];
  };
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    action: string;
  }>;
}

export interface Achievement {
  id: number;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  total_returns: number;
  returns_percentage: number;
  total_trades: number;
  win_rate: number;
}

// Trading API
export const tradingAPI = {
  getPortfolio: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<Portfolio>('/api/trading/portfolio', { headers });
  },
  createPortfolio: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.post<Portfolio>('/api/trading/portfolio/create', {}, { headers });
  },
  getPositions: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<Position[]>('/api/trading/positions', { headers });
  },
  
  placeOrder: (data: {
    symbol: string;
    side: string;
    quantity: number;
    order_type: string;
    limit_price?: number;
  }, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.post<Order>('/api/trading/orders', data, { headers });
  },
  
  getOrders: (status?: string, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<Order[]>(`/api/trading/orders${status ? `?status=${status}` : ''}`, { headers });
  },
  cancelOrder: (orderId: number, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.delete(`/api/trading/orders/${orderId}`, { headers });
  },
  
  getTransactions: (limit: number = 50, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<Transaction[]>(`/api/trading/transactions?limit=${limit}`, { headers });
  },
  
  simulateTrade: (data: {
    symbol: string;
    side: string;
    quantity: number;
  }, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.post('/api/trading/simulate', data, { headers });
  },
  
  getAnalysis: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<PortfolioAnalysis>('/api/trading/analysis', { headers });
  },
  getSignal: (symbol: string, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<TradingSignal>(`/api/trading/signals/${symbol}`, { headers });
  },
  getSignals: (symbol?: string, limit: number = 10, token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<TradingSignal[]>(`/api/trading/signals${symbol ? `?symbol=${symbol}` : ''}?limit=${limit}`, { headers });
  },
  
  getLeaderboard: (limit: number = 100) => 
    api.get<LeaderboardEntry[]>(`/api/trading/leaderboard?limit=${limit}`),
  
  // Real-time leaderboard with calculated statistics
  getRealtimeLeaderboard: (limit: number = 50, days: number = 30) =>
    api.get<LeaderboardEntry[]>(`/api/leaderboard/realtime?limit=${limit}&days=${days}`),
  
  // Get user-specific stats
  getUserStats: (userId: number, days: number = 30) =>
    api.get(`/api/leaderboard/user/${userId}/stats?days=${days}`),
  
  getAchievements: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.get<Achievement[]>('/api/trading/achievements', { headers });
  },
};
