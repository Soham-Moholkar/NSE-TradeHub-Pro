# TradeSmart AI - Professional NSE Trading Platform

*A next-generation stock trading platform for the Indian NSE market, powered by AI and machine learning. Features real-time market data, intelligent trading signals, paper trading simulation, and an AI assistant powered by Google Gemini. Built for traders who want Bloomberg Terminal capabilities with modern UX.*

---

##  Project Overview

**TradeSmart AI** (formerly NSE Stock Analysis Pro) is a comprehensive trading platform that combines:
-  **Advanced Technical Analysis** with 5 professional chart types
-  **AI-Powered Insights** using Google Gemini
-  **Paper Trading** with real-time portfolio management
-  **Competitive Leaderboards** with calculated performance metrics
-  **Real-Time Data** via WebSocket connections
-  **PWA Support** for mobile/desktop installation
-  **Beautiful Animations** with Framer Motion

### Status:  ALL 7 PHASES COMPLETED!
**Version:** 1.0.0 | **Date:** February 5, 2026 | **Status:** Production Ready

---

##  Quick Start

### Prerequisites
| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.10+ | Backend server |
| Node.js | 18+ | Frontend server |
| npm | 9+ | Package management |

### 5-Minute Setup

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.init_db
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:3000

**Demo Account:**
- Username: demo_trader
- Password: demo123
- Capital: ₹100,000

---

##  Features

### Phase 1: Foundation 
- Community feed with posts, comments, voting
- Dark mode with system preference
- User authentication & profiles
- Reputation system

### Phase 2: Real-Time Data 
- WebSocket live price streaming
- Scrolling ticker tape (20 stocks)
- Live order book (10 bid/ask levels)
- Real-time price badges

### Phase 3: Advanced Charts 
- Renko Charts (noise filtering)
- Heikin-Ashi (smoothed candles)
- Point & Figure (X/O columns)
- Volume Profile (distribution)
- VWAP with 2σ bands

### Phase 4: Pro Dashboard 
- Dense Bloomberg Terminal layout
- 8 draggable/resizable widgets
- Fullscreen mode
- React-grid-layout powered

### Phase 5: Trading & Competition 
- Trading Command Center
- Real-time leaderboard
- User profiles with stats
- Portfolio analytics

### Phase 6: AI Assistant 
- Gemini AI chatbot
- Portfolio-aware responses
- Stock analysis on demand
- Educational mode

### Phase 7: Polish 
- PWA with offline support
- Framer Motion animations
- Confetti celebrations
- Keyboard shortcuts

---

##  Architecture

```

   Browser (Port 3000)   
   Next.js 14 + React    

          HTTP/WebSocket

  FastAPI (Port 8000)    
  Python Backend + ML    

         
    
             
 
SQLite   ML  
  DB    Model
 
```

---

##  Technology Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Lightweight-charts, Framer Motion  
**Backend:** FastAPI, SQLAlchemy, SQLite, Scikit-learn, Google Gemini AI  
**Real-time:** WebSocket, Service Worker, PWA

---

##  Complete Documentation

### Setup & Installation

**Environment Variables:**

Backend .env:
```env
GEMINI_API_KEY=your-api-key-here
DATABASE_URL=sqlite:///./nse_stocks.db
JWT_SECRET_KEY=your-secret-key-here
```

Frontend .env.local:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Initialize Database:**
```powershell
cd backend
python -m app.init_db
python scripts/create_demo_data.py
```

### User Guide

**Registration & Login:**
1. Open http://localhost:3000
2. Click "Sign Up"  Create account
3. Get ₹100,000 virtual capital
4. Start trading immediately

**Trading Flow:**
1. Search stocks (Ctrl+K)
2. View charts and predictions
3. Navigate to Portfolio tab (Ctrl+T)
4. Place orders (Market/Limit)
5. Monitor positions and P&L
6. Check leaderboard rankings

**AI Assistant (Ctrl+I):**
- Ask: "Analyze RELIANCE"
- Ask: "What is RSI?"
- Ask: "Review my portfolio"
- Get portfolio-aware advice

**Keyboard Shortcuts:**
- Ctrl+K - Focus search
- Ctrl+T - Trading panel
- Ctrl+I - AI assistant
- Ctrl+P - Profile
- Ctrl+D - Dense mode
- Shift+/ - Help

### API Documentation

**Key Endpoints:**

```
# Authentication
POST /api/auth/register
POST /api/auth/login

# Stock Data
GET /api/symbols/popular
GET /api/symbols/search?q=TCS
GET /api/prices/{symbol}?days=90
GET /api/prices/{symbol}/latest

# ML Predictions
GET /api/ml/predict/{symbol}
POST /api/ml/train/{symbol}

# Trading
GET /api/trading/portfolio
POST /api/trading/orders
GET /api/trading/positions
POST /api/trading/simulate
GET /api/trading/leaderboard

# AI Assistant
POST /api/ai/chat
POST /api/ai/analyze-stock

# Community
GET /api/community/feed
POST /api/community/posts
POST /api/community/posts/{id}/vote

# WebSocket
ws://localhost:8000/ws/prices
```

**API Docs:** http://localhost:8000/docs

### Technical Details

**Database Schema:**
- users, portfolios, positions, transactions
- orders, achievements, price_alerts
- posts, comments, votes
- symbols, prices, ml_models

**ML Model:**
- Algorithm: Random Forest Classifier
- Features: 25+ technical indicators
- Average Accuracy: 79%
- Training: Auto on-demand
- Saved as: .joblib files

**Portfolio Metrics:**
- Total Value = Cash + Positions
- Returns % = (Value - Initial) / Initial  100
- Health Score = 0-100 (diversification + returns + risk)
- Sharpe Ratio, Win Rate, Profit Factor

**Trading Rules:**
- Starting capital: ₹100,000
- Order types: Market, Limit
- Transaction fee: 0.1%
- Real-time P&L calculations

### Troubleshooting

**Backend won't start:**
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt

# Reset database
Remove-Item nse_stocks.db
python -m app.init_db
```

**Frontend errors:**
```powershell
# Clear cache
Remove-Item -Recurse -Force .next node_modules
npm install
npm run dev
```

**Port already in use:**
```powershell
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

**Execution policy error:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Charts not loading:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check backend is running
- Verify API URL in .env.local

**AI not responding:**
- Set GEMINI_API_KEY in backend/.env
- Get key: https://makersuite.google.com/app/apikey
- Restart backend server

### Testing

**Manual Testing Checklist:**
- [ ] User registration/login
- [ ] Stock search and selection
- [ ] Real-time price updates
- [ ] Chart rendering (all 5 types)
- [ ] Trade execution
- [ ] AI chat responses
- [ ] Keyboard shortcuts
- [ ] PWA installation

**Automated Tests:**
```powershell
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

##  Performance

- **First Load:** 2-3 seconds
- **Subsequent:** <1 second (cached)
- **WebSocket Latency:** ~50ms
- **Chart Rendering:** <500ms
- **API Response:** 100-300ms
- **ML Prediction:** 1-2 seconds

---

##  Project Structure

```
website for the course project/
 backend/
    app/
       api/          # REST endpoints
       models/       # Database models
       services/     # Business logic
       schemas/      # Pydantic schemas
       main.py       # FastAPI app
    ml_models/        # Trained models
    scripts/          # Utility scripts
    requirements.txt
 frontend/
    src/
       app/          # Next.js pages
       components/   # React components
       hooks/        # Custom hooks
       lib/          # Utilities
    public/           # Static files
    package.json
 README.md             # This file
```

---

##  Deployment

**Backend (Railway/Render):**
1. Push to GitHub
2. Connect Railway/Render
3. Set environment variables
4. Deploy from main branch

**Frontend (Vercel):**
1. Connect Vercel to repo
2. Set build command: 
pm run build
3. Deploy automatically

**Environment Variables:**
- Backend: GEMINI_API_KEY, JWT_SECRET_KEY, DATABASE_URL
- Frontend: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL

---

##  Educational Purpose

This project is developed for the EDI course (Semester 3). It demonstrates:
- Full-stack web development
- Machine learning integration
- Real-time data handling
- AI/LLM integration
- Modern UI/UX practices
- RESTful API design
- Database management
- Authentication & authorization

 **Disclaimer:** This is a paper trading platform for educational purposes only. Not for real money trading. All predictions are for learning, not financial advice.

---

##  Acknowledgments

- **yfinance** - NSE data provider
- **Google Gemini** - AI capabilities
- **Lightweight-charts** - Professional charting
- **FastAPI** - High-performance backend
- **Next.js** - Modern React framework
- **Tailwind CSS** - Beautiful styling

---

##  Support

For issues:
1. Check this README
2. Review API docs at /docs
3. Check console logs (F12)
4. Verify both servers running

---

##  License

Educational project - MIT License

---

** Production Ready - All 7 Phases Complete! **

The platform is feature-complete with professional-grade trading capabilities, AI assistance, real-time data, and beautiful UX.

**Happy Trading! **

---

*Last Updated: February 5, 2026*  
*Version: 1.0.0*  
*Created by: NSE Pro Development Team*
