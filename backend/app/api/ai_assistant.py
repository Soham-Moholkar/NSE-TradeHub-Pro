"""
AI Trading Assistant API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..db import get_db
from ..services.ai_service import ai_assistant
from ..services.auth_service import get_current_active_user

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []
    include_portfolio: bool = True

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class StockAnalysisRequest(BaseModel):
    symbol: str
    price_data: Dict[str, Any]

class IndicatorRequest(BaseModel):
    indicator_name: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Chat with AI trading assistant
    Context-aware with portfolio information
    """
    try:
        # Get portfolio data if requested
        portfolio_data = None
        if request.include_portfolio:
            # You would fetch actual portfolio data here
            # For now, we'll pass None - the service handles it gracefully
            pass
        
        # Convert Pydantic models to dicts
        history = [msg.dict() for msg in request.conversation_history] if request.conversation_history else []
        
        # Get AI response
        response_text = await ai_assistant.chat(
            message=request.message,
            conversation_history=history,
            portfolio_data=portfolio_data
        )
        
        from datetime import datetime
        return ChatResponse(
            response=response_text,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-stock", response_model=ChatResponse)
async def analyze_stock(
    request: StockAnalysisRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get AI analysis for a specific stock
    """
    try:
        response_text = await ai_assistant.analyze_stock(
            symbol=request.symbol,
            price_data=request.price_data
        )
        
        from datetime import datetime
        return ChatResponse(
            response=response_text,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-indicator", response_model=ChatResponse)
async def explain_indicator(request: IndicatorRequest):
    """
    Get explanation of a technical indicator
    """
    try:
        response_text = await ai_assistant.explain_indicator(
            indicator_name=request.indicator_name
        )
        
        from datetime import datetime
        return ChatResponse(
            response=response_text,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
