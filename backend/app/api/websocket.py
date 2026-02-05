"""
WebSocket API Endpoints
Provides real-time data streaming via WebSocket connections
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_service import ws_manager
from app.services.nse_service import nse_service
import asyncio

router = APIRouter()

@router.websocket("/ws/prices/{symbol}")
async def websocket_price_stream(
    websocket: WebSocket,
    symbol: str
):
    """
    WebSocket endpoint for real-time price streaming
    
    Usage:
    - Connect to ws://localhost:8000/api/ws/prices/RELIANCE
    - Receive continuous price updates every 1-3 seconds
    - Data includes: price, bid/ask, volume, order book
    """
    await websocket.accept()
    
    try:
        # Get initial price from NSE service
        quote_data = nse_service.get_quote(symbol)
        base_price = quote_data.get("lastPrice", 2500.0) if quote_data else 2500.0
        
        # Register connection
        await ws_manager.connect(websocket, symbol)
        
        # Send initial data immediately
        await websocket.send_json({
            "type": "connected",
            "symbol": symbol,
            "message": f"Connected to {symbol} live stream",
            "basePrice": base_price
        })
        
        # Start streaming prices in background
        stream_task = asyncio.create_task(
            ws_manager.stream_prices(symbol, base_price)
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for client messages (ping/pong, commands, etc.)
                data = await websocket.receive_text()
                # Echo back (can add command handling here)
                await websocket.send_json({
                    "type": "echo",
                    "data": data
                })
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error receiving data: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"Client disconnected from {symbol}")
    except Exception as e:
        print(f"WebSocket error for {symbol}: {e}")
    finally:
        # Cleanup
        ws_manager.disconnect(websocket, symbol)
        if 'stream_task' in locals():
            stream_task.cancel()


@router.websocket("/ws/market-feed")
async def websocket_market_feed(websocket: WebSocket):
    """
    WebSocket endpoint for multi-symbol market feed
    
    Usage:
    - Connect to ws://localhost:8000/api/ws/market-feed
    - Send {"subscribe": ["RELIANCE", "TCS", "INFY"]} to subscribe
    - Send {"unsubscribe": ["RELIANCE"]} to unsubscribe
    - Receive updates for all subscribed symbols
    """
    await websocket.accept()
    subscribed_symbols = set()
    
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to market feed. Send subscribe/unsubscribe commands."
        })
        
        while True:
            # Receive subscription commands
            data = await websocket.receive_json()
            
            if "subscribe" in data:
                symbols = data["subscribe"]
                for symbol in symbols:
                    if symbol not in subscribed_symbols:
                        subscribed_symbols.add(symbol)
                        await ws_manager.connect(websocket, symbol)
                        
                        # Start streaming if not already streaming
                        quote_data = nse_service.get_quote(symbol)
                        base_price = quote_data.get("lastPrice", 2500.0) if quote_data else 2500.0
                        asyncio.create_task(ws_manager.stream_prices(symbol, base_price))
                
                await websocket.send_json({
                    "type": "subscribed",
                    "symbols": list(subscribed_symbols)
                })
            
            elif "unsubscribe" in data:
                symbols = data["unsubscribe"]
                for symbol in symbols:
                    if symbol in subscribed_symbols:
                        subscribed_symbols.remove(symbol)
                        ws_manager.disconnect(websocket, symbol)
                
                await websocket.send_json({
                    "type": "unsubscribed",
                    "symbols": list(subscribed_symbols)
                })
                
    except WebSocketDisconnect:
        print("Client disconnected from market feed")
    except Exception as e:
        print(f"Market feed error: {e}")
    finally:
        # Cleanup all subscriptions
        for symbol in subscribed_symbols:
            ws_manager.disconnect(websocket, symbol)


@router.get("/ws/test")
async def test_websocket_service():
    """Test endpoint to verify WebSocket service is running"""
    return {
        "status": "ok",
        "message": "WebSocket service is running",
        "endpoints": [
            "/ws/prices/{symbol} - Real-time price stream for a symbol",
            "/ws/market-feed - Multi-symbol market feed with subscribe/unsubscribe"
        ]
    }
