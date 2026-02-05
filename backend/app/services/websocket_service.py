"""
WebSocket Service for Real-time NSE Data Streaming
Provides live price updates, order book data, and market events
"""

import asyncio
import json
from typing import Set, Dict, Optional
from datetime import datetime
import random

class WebSocketManager:
    """Manages WebSocket connections and real-time data streaming"""
    
    def __init__(self):
        # Store active connections per symbol
        self.active_connections: Dict[str, Set] = {}
        # Cache for latest prices
        self.price_cache: Dict[str, Dict] = {}
        # Simulated order book data
        self.order_books: Dict[str, Dict] = {}
        
    async def connect(self, websocket, symbol: str):
        """Register a new WebSocket connection for a symbol"""
        if symbol not in self.active_connections:
            self.active_connections[symbol] = set()
        self.active_connections[symbol].add(websocket)
        print(f"✅ Client connected to {symbol}. Total connections: {len(self.active_connections[symbol])}")
        
    def disconnect(self, websocket, symbol: str):
        """Remove a WebSocket connection"""
        if symbol in self.active_connections:
            self.active_connections[symbol].discard(websocket)
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]
        print(f"❌ Client disconnected from {symbol}")
        
    async def broadcast_price_update(self, symbol: str, data: Dict):
        """Broadcast price update to all connected clients for a symbol"""
        if symbol in self.active_connections:
            message = json.dumps({
                "type": "price_update",
                "symbol": symbol,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
            
            # Send to all connected clients
            disconnected = set()
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error sending to client: {e}")
                    disconnected.add(connection)
            
            # Clean up disconnected clients
            for conn in disconnected:
                self.disconnect(conn, symbol)
    
    async def generate_realistic_price_data(self, symbol: str, base_price: float):
        """
        Generate realistic price movements with:
        - Intraday volatility
        - Bid-ask spread
        - Volume fluctuations
        - Price trends
        """
        # Initialize if not in cache
        if symbol not in self.price_cache:
            self.price_cache[symbol] = {
                "price": base_price,
                "open": base_price,
                "high": base_price,
                "low": base_price,
                "trend": random.choice([-1, 0, 1])  # -1: down, 0: sideways, 1: up
            }
        
        cache = self.price_cache[symbol]
        
        # Simulate price movement with trend bias
        volatility = base_price * 0.002  # 0.2% volatility
        trend_bias = cache["trend"] * volatility * 0.3
        price_change = random.uniform(-volatility, volatility) + trend_bias
        
        new_price = cache["price"] + price_change
        new_price = max(new_price, base_price * 0.95)  # Floor at -5%
        new_price = min(new_price, base_price * 1.05)  # Cap at +5%
        
        # Update highs/lows
        cache["high"] = max(cache["high"], new_price)
        cache["low"] = min(cache["low"], new_price)
        cache["price"] = new_price
        
        # Occasionally change trend
        if random.random() < 0.05:  # 5% chance
            cache["trend"] = random.choice([-1, 0, 1])
        
        # Calculate derived values
        change = new_price - cache["open"]
        change_percent = (change / cache["open"]) * 100
        
        # Bid-ask spread (0.05% - 0.15%)
        spread_percent = random.uniform(0.0005, 0.0015)
        bid = new_price * (1 - spread_percent / 2)
        ask = new_price * (1 + spread_percent / 2)
        
        # Volume (realistic range)
        volume = random.randint(10000, 500000)
        
        return {
            "symbol": symbol,
            "price": round(new_price, 2),
            "open": round(cache["open"], 2),
            "high": round(cache["high"], 2),
            "low": round(cache["low"], 2),
            "change": round(change, 2),
            "changePercent": round(change_percent, 2),
            "bid": round(bid, 2),
            "ask": round(ask, 2),
            "volume": volume,
            "lastUpdated": datetime.now().isoformat()
        }
    
    async def generate_order_book(self, symbol: str, current_price: float):
        """
        Generate realistic order book with bid/ask levels
        Shows depth on both sides of the market
        """
        # Generate 10 bid levels (below current price)
        bids = []
        for i in range(10):
            price = current_price - (i + 1) * random.uniform(0.5, 2.0)
            quantity = random.randint(100, 10000)
            orders = random.randint(1, 50)
            bids.append({
                "price": round(price, 2),
                "quantity": quantity,
                "orders": orders
            })
        
        # Generate 10 ask levels (above current price)
        asks = []
        for i in range(10):
            price = current_price + (i + 1) * random.uniform(0.5, 2.0)
            quantity = random.randint(100, 10000)
            orders = random.randint(1, 50)
            asks.append({
                "price": round(price, 2),
                "quantity": quantity,
                "orders": orders
            })
        
        return {
            "symbol": symbol,
            "bids": bids,  # Sorted high to low
            "asks": asks,  # Sorted low to high
            "spread": round(asks[0]["price"] - bids[0]["price"], 2),
            "timestamp": datetime.now().isoformat()
        }
    
    async def stream_prices(self, symbol: str, base_price: float):
        """
        Continuously stream price updates for a symbol
        Updates every 1-3 seconds with realistic data
        """
        while symbol in self.active_connections:
            try:
                # Generate price update
                price_data = await self.generate_realistic_price_data(symbol, base_price)
                
                # Generate order book
                order_book = await self.generate_order_book(symbol, price_data["price"])
                
                # Broadcast price update
                await self.broadcast_price_update(symbol, {
                    "price": price_data,
                    "orderBook": order_book
                })
                
                # Random delay between 1-3 seconds
                await asyncio.sleep(random.uniform(1.0, 3.0))
                
            except Exception as e:
                print(f"Error in price stream for {symbol}: {e}")
                break
    
    async def broadcast_trade(self, symbol: str, trade_data: Dict):
        """Broadcast individual trade to subscribers"""
        if symbol in self.active_connections:
            message = json.dumps({
                "type": "trade",
                "symbol": symbol,
                "data": trade_data,
                "timestamp": datetime.now().isoformat()
            })
            
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_text(message)
                except:
                    pass

# Global WebSocket manager instance
ws_manager = WebSocketManager()
