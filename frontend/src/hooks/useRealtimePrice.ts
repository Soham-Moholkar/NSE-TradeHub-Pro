/**
 * React Hook for Real-time Price Streaming via WebSocket
 * Automatically manages connection lifecycle and provides live price updates
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RealtimePrice {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  lastUpdated: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  timestamp: string;
}

interface RealtimeData {
  price: RealtimePrice | null;
  orderBook: OrderBook | null;
  connected: boolean;
  error: string | null;
}

export function useRealtimePrice(symbol: string | null): RealtimeData {
  const [price, setPrice] = useState<RealtimePrice | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!symbol || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `ws://localhost:8000/api/ws/prices/${symbol}`;
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`✅ WebSocket connected for ${symbol}`);
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'connected') {
            console.log(`📡 Subscribed to ${symbol} at base price ${message.basePrice}`);
          } else if (message.type === 'price_update') {
            // Update price and order book
            if (message.data.price) {
              setPrice(message.data.price);
            }
            if (message.data.orderBook) {
              setOrderBook(message.data.orderBook);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log(`❌ WebSocket disconnected for ${symbol}`);
        setConnected(false);
        wsRef.current = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Failed to connect after multiple attempts');
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create connection');
    }
  }, [symbol]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
    setPrice(null);
    setOrderBook(null);
  }, []);

  useEffect(() => {
    if (symbol) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [symbol, connect, disconnect]);

  return { price, orderBook, connected, error };
}

/**
 * Hook for subscribing to multiple symbols simultaneously
 */
export function useMarketFeed(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (symbols.length === 0) return;

    const wsUrl = 'ws://localhost:8000/api/ws/market-feed';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Market feed connected');
      setConnected(true);
      
      // Subscribe to symbols
      ws.send(JSON.stringify({ subscribe: symbols }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'price_update' && message.data.price) {
          setPrices(prev => ({
            ...prev,
            [message.symbol]: message.data.price
          }));
        }
      } catch (err) {
        console.error('Error parsing market feed message:', err);
      }
    };

    ws.onclose = () => {
      console.log('❌ Market feed disconnected');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [symbols.join(',')]); // Only reconnect if symbols change

  return { prices, connected };
}
