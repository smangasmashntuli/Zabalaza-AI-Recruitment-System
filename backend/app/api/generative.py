from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from ..services.gemini_service import get_gemini_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


@router.post('/chat', response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """Proxy endpoint to perform chat via server-side Gemini service.

    This keeps the API key secret on the server and avoids calling Google APIs
    directly from the browser.
    """
    try:
        svc = get_gemini_service()
        
        # Debug logging
        logger.info(f"🔍 Chat endpoint called")
        logger.info(f"   - Service exists: {bool(svc)}")
        logger.info(f"   - Service enabled: {getattr(svc, 'enabled', False) if svc else False}")
        
        if not svc or not getattr(svc, 'enabled', False):
            error_msg = "LLM service is not available. Please check GEMINI_API_KEY configuration."
            logger.error(f"❌ {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=error_msg
            )

        # Try to generate response
        logger.info(f"📤 Calling Gemini chat with message: {req.message[:50]}...")
        reply = svc.chat(req.message, conversation_history=req.history, context=req.context)
        
        if not reply:
            logger.error("❌ Gemini returned empty response")
            raise HTTPException(
                status_code=500,
                detail="Gemini returned empty response"
            )
        
        logger.info(f"📥 Gemini responded successfully: {reply[:50]}...")
        return ChatResponse(reply=reply)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Chat error: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat error: {str(e)}"
        )

