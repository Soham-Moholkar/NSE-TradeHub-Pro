"""
Gemini AI Trading Assistant Service
Portfolio-aware AI chatbot for trading advice
"""
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..config import settings

class AITradingAssistant:
    """AI-powered trading assistant using Google Gemini"""
    
    def __init__(self):
        # Initialize Gemini AI
        api_key = settings.GEMINI_API_KEY
        if api_key:
            genai.configure(api_key=api_key)
            # Use gemini-2.5-flash which is available
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None
        
        self.system_prompt = """You are an expert stock market analyst and trading advisor for the Indian NSE (National Stock Exchange). 
Your role is to provide insightful, data-driven advice to traders.

Key responsibilities:
- Analyze stocks listed on NSE
- Explain technical indicators and chart patterns
- Provide trading strategies and risk management advice
- Interpret market trends and news impact
- Help users understand their portfolio performance
- Suggest entry/exit points based on analysis

Guidelines:
- Always mention that this is for educational purposes and not financial advice
- Be concise but informative (2-3 paragraphs max)
- Use Indian Rupees (₹) for currency
- Reference relevant NSE stocks when applicable
- Consider current market conditions
- Explain complex concepts simply

Current date: {current_date}
"""
    
    def get_portfolio_context(self, portfolio_data: Optional[Dict[str, Any]] = None) -> str:
        """Generate context from user's portfolio"""
        if not portfolio_data:
            return "User has not provided portfolio information."
        
        context = f"\n\nUser's Portfolio Context:\n"
        context += f"- Total Portfolio Value: ₹{portfolio_data.get('total_value', 0):,.2f}\n"
        context += f"- Total Returns: ₹{portfolio_data.get('total_returns', 0):,.2f} ({portfolio_data.get('returns_pct', 0):.2f}%)\n"
        context += f"- Win Rate: {portfolio_data.get('win_rate', 0):.1f}%\n"
        
        positions = portfolio_data.get('positions', [])
        if positions:
            context += f"- Active Positions: {len(positions)}\n"
            context += "  Top holdings:\n"
            for pos in positions[:5]:
                pnl_sign = '+' if pos.get('unrealized_pnl', 0) >= 0 else ''
                context += f"  • {pos.get('symbol')}: {pos.get('quantity')} shares @ ₹{pos.get('average_price', 0):.2f} (P&L: {pnl_sign}₹{pos.get('unrealized_pnl', 0):.2f})\n"
        
        return context
    
    async def chat(
        self, 
        message: str, 
        conversation_history: List[Dict[str, str]] = None,
        portfolio_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Chat with AI assistant
        
        Args:
            message: User's message
            conversation_history: Previous messages for context
            portfolio_data: User's portfolio information for context-aware responses
        
        Returns:
            AI response text
        """
        if not self.model:
            return "AI service is not configured. Please set GEMINI_API_KEY environment variable."
        
        try:
            # Build context with system prompt and portfolio
            current_date = datetime.now().strftime("%B %d, %Y")
            full_prompt = self.system_prompt.format(current_date=current_date)
            
            # Add portfolio context if available
            if portfolio_data:
                full_prompt += self.get_portfolio_context(portfolio_data)
            
            # Add conversation history
            if conversation_history:
                full_prompt += "\n\nConversation History:\n"
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    full_prompt += f"{role.capitalize()}: {content}\n"
            
            # Add current user message
            full_prompt += f"\n\nUser: {message}\n\nAssistant:"
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            return response.text
            
        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."
    
    async def analyze_stock(self, symbol: str, price_data: Dict[str, Any]) -> str:
        """
        Provide quick analysis of a specific stock
        
        Args:
            symbol: Stock symbol
            price_data: Recent price information
        
        Returns:
            Analysis text
        """
        if not self.model:
            return "AI service is not configured."
        
        try:
            prompt = f"""Provide a brief technical analysis for {symbol} (NSE) based on this data:

Current Price: ₹{price_data.get('current_price', 0):.2f}
Day Change: {price_data.get('change_pct', 0):.2f}%
Day High: ₹{price_data.get('high', 0):.2f}
Day Low: ₹{price_data.get('low', 0):.2f}
Volume: {price_data.get('volume', 0):,}

Provide:
1. Technical outlook (2-3 sentences)
2. Key support/resistance levels
3. Trading suggestion (buy/sell/hold) with reasoning

Keep it concise and actionable."""

            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Analysis unavailable: {str(e)}"
    
    async def explain_indicator(self, indicator_name: str) -> str:
        """Explain a technical indicator"""
        if not self.model:
            return "AI service is not configured."
        
        try:
            prompt = f"""Explain the '{indicator_name}' technical indicator for stock trading in simple terms.

Include:
1. What it measures (1-2 sentences)
2. How traders use it
3. A practical example with NSE stocks

Keep it under 150 words and beginner-friendly."""

            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Explanation unavailable: {str(e)}"

# Singleton instance
ai_assistant = AITradingAssistant()
