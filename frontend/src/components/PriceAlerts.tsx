'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, Plus, Trash2, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, X, Edit2, ArrowUp, ArrowDown
} from 'lucide-react';

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: Date;
  triggered: boolean;
  triggeredAt?: Date;
}

interface PriceAlertsProps {
  currentSymbol?: string;
  currentPrice?: number;
}

const POPULAR_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'WIPRO', 'SBIN'];

export default function PriceAlerts({ currentSymbol = 'RELIANCE', currentPrice = 0 }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: currentSymbol,
    targetPrice: currentPrice,
    condition: 'above' as 'above' | 'below'
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load alerts from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('nse-price-alerts');
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          triggeredAt: a.triggeredAt ? new Date(a.triggeredAt) : undefined
        })));
      } catch (e) {
        console.error('Error loading alerts:', e);
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('nse-price-alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Update newAlert when currentSymbol or currentPrice changes
  useEffect(() => {
    if (currentSymbol) {
      setNewAlert(prev => ({ ...prev, symbol: currentSymbol }));
    }
    if (currentPrice > 0) {
      setNewAlert(prev => ({ ...prev, targetPrice: Math.round(currentPrice * 1.05) }));
    }
  }, [currentSymbol, currentPrice]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addAlert = () => {
    if (!newAlert.symbol || newAlert.targetPrice <= 0) {
      showNotification('Please enter valid symbol and price', 'error');
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      targetPrice: newAlert.targetPrice,
      condition: newAlert.condition,
      createdAt: new Date(),
      triggered: false
    };

    setAlerts([alert, ...alerts]);
    setShowAddForm(false);
    setNewAlert({ symbol: currentSymbol, targetPrice: currentPrice, condition: 'above' });
    showNotification(`Alert created for ${alert.symbol}`, 'success');
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    showNotification('Alert deleted', 'success');
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6 glass-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg relative">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Price Alerts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{activeAlerts.length} active alerts</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">{showAddForm ? 'Cancel' : 'New Alert'}</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          {notification.type === 'success' 
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />
          }
          {notification.message}
        </div>
      )}

      {/* Add Alert Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg animate-slideUp">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Symbol Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Symbol
              </label>
              <select
                value={newAlert.symbol}
                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {POPULAR_STOCKS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Condition
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    newAlert.condition === 'above'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  Above
                </button>
                <button
                  onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    newAlert.condition === 'below'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                  Below
                </button>
              </div>
            </div>

            {/* Target Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Price (₹)
              </label>
              <input
                type="number"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert({ ...newAlert, targetPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>
          </div>

          {/* Current Price Info */}
          {currentPrice > 0 && newAlert.symbol === currentSymbol && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Current price of {currentSymbol}: <span className="font-medium text-gray-800 dark:text-white">₹{currentPrice.toFixed(2)}</span>
            </p>
          )}

          <button
            onClick={addAlert}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Create Alert
          </button>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Active Alerts
          </h3>
          {activeAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.condition === 'above' 
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {alert.condition === 'above' 
                    ? <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    : <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{alert.symbol}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Alert when price goes {alert.condition} ₹{alert.targetPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : !showAddForm && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <BellRing className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">No Active Alerts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Create alerts to get notified when stocks hit your target price
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Create your first alert
          </button>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Triggered Alerts
          </h3>
          {triggeredAlerts.slice(0, 3).map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{alert.symbol}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {alert.condition === 'above' ? 'Reached above' : 'Dropped below'} ₹{alert.targetPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Alert Buttons */}
      {currentPrice > 0 && !showAddForm && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick alerts for {currentSymbol}</p>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15].map((percent) => (
              <React.Fragment key={percent}>
                <button
                  onClick={() => {
                    setNewAlert({
                      symbol: currentSymbol,
                      targetPrice: currentPrice * (1 + percent / 100),
                      condition: 'above'
                    });
                    setShowAddForm(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  +{percent}% (₹{(currentPrice * (1 + percent / 100)).toFixed(0)})
                </button>
                <button
                  onClick={() => {
                    setNewAlert({
                      symbol: currentSymbol,
                      targetPrice: currentPrice * (1 - percent / 100),
                      condition: 'below'
                    });
                    setShowAddForm(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  -{percent}% (₹{(currentPrice * (1 - percent / 100)).toFixed(0)})
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
