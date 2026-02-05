'use client';

import React, { useState, useEffect } from 'react';
import { tradingAPI } from '@/lib/api';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Plus, Search } from 'lucide-react';

interface Order {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  created_at: string;
}

export default function TradingCommandCenter() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await tradingAPI.getOrders();
      const orders = response.data;
      
      setActiveOrders(orders.filter((o: Order) => o.status === 'PENDING'));
      setOrderHistory(orders.filter((o: Order) => o.status !== 'PENDING'));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedSymbol || !quantity) return;

    try {
      if (orderType === 'MARKET') {
        await tradingAPI.placeTrade(selectedSymbol, side, parseInt(quantity));
      } else {
        // For limit orders, we'd need a different endpoint
        await tradingAPI.placeTrade(selectedSymbol, side, parseInt(quantity));
      }
      
      setSelectedSymbol('');
      setQuantity('');
      setPrice('');
      loadOrders();
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      // Would need cancel endpoint in API
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Trading Command Center
        </h2>
        <p className="text-sm text-blue-100 mt-1">Advanced order management & execution</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Quick Order Panel */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Place Order</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Symbol Input */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Symbol
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., RELIANCE"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Side Selection */}
            <div className="col-span-2 flex gap-2">
              <button
                onClick={() => setSide('BUY')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  side === 'BUY'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                BUY
              </button>
              <button
                onClick={() => setSide('SELL')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  side === 'SELL'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingDown className="w-5 h-5 inline mr-2" />
                SELL
              </button>
            </div>

            {/* Order Type */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('MARKET')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    orderType === 'MARKET'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType('LIMIT')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    orderType === 'LIMIT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price (for limit orders) */}
            {orderType === 'LIMIT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limit Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Place Order Button */}
            <div className="col-span-2">
              <button
                onClick={placeOrder}
                disabled={!selectedSymbol || !quantity}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Place {side} Order
              </button>
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Active Orders ({activeOrders.length})
          </h3>
          
          {activeOrders.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No active orders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 dark:text-white">{order.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.side === 'BUY'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {order.side}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {order.quantity} @ ₹{order.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Order History</h3>
          
          {orderHistory.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No order history</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {orderHistory.slice(0, 20).map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{order.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        order.side === 'BUY'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {order.side}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {order.quantity} @ ₹{order.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 'FILLED' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
