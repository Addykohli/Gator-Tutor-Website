"""
FastAPI router for AI query endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from search.database import get_db
from .schemas import (
    AIQueryRequest, 
    AIQueryResponse, 
    SchemaInfoResponse,
    SQLExecuteRequest,
    SQLExecuteResponse,
    QueryExecution
)
from .sql_executor import SQLExecutor
from .config import ai_config

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/query", response_model=AIQueryResponse)
async def ai_query(request: AIQueryRequest, db: Session = Depends(get_db)):
    """
    Process a natural language query using OpenRouter AI (DeepSeek R1).
    
    The AI will:
    1. Understand your question
    2. Generate and execute SQL queries as needed
    3. Analyze the results
    4. Provide a helpful response
    
    Only SELECT queries are allowed - no data modification.
    """
    try:
        from .service import GeminiSQLService
        
        service = GeminiSQLService(db)
        result = await service.query(
            user_prompt=request.prompt,
            user_id=request.user_id,
            user_role=request.user_role
        )
        
        # Convert to response model
        queries = [
            QueryExecution(
                query=q.get("query", ""),
                success=q.get("success", False),
                row_count=q.get("row_count", 0),
                rows=q.get("rows", []),
                error=q.get("error")
            )
            for q in result.get("queries_executed", [])
        ]
        
        return AIQueryResponse(
            success=result.get("success", False),
            response=result.get("response"),
            error=result.get("error"),
            queries_executed=queries,
            function_calls=result.get("function_calls", 0)
        )
        
    except ImportError as e:
        raise HTTPException(
            status_code=503, 
            detail=f"AI service not available: {str(e)}"
        )
    except ValueError as e:
        error_msg = str(e)
        if "402" in error_msg or "payment" in error_msg.lower():
            raise HTTPException(
                status_code=402,
                detail="OpenRouter API key requires credits. Please add credits at https://openrouter.ai/"
            )
        raise HTTPException(
            status_code=503, 
            detail=f"AI service configuration error: {error_msg}"
        )
    except Exception as e:
        error_msg = str(e)
        if "402" in error_msg or "payment" in error_msg.lower():
            raise HTTPException(
                status_code=402,
                detail="OpenRouter API key requires credits. Please add credits at https://openrouter.ai/"
            )
        raise HTTPException(
            status_code=500, 
            detail=f"AI query failed: {error_msg}"
        )


@router.get("/schema", response_model=SchemaInfoResponse)
async def get_schema(db: Session = Depends(get_db)):
    """
    Get database schema information.
    
    Returns table and column information for the database.
    Useful for understanding what data is available.
    """
    try:
        executor = SQLExecutor(db)
        result = executor.get_schema_info()
        
        return SchemaInfoResponse(
            success=result.get("success", False),
            schema_info=result.get("schema"),
            error=result.get("error")
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get schema: {str(e)}"
        )


@router.post("/sql", response_model=SQLExecuteResponse)
async def execute_sql(request: SQLExecuteRequest, db: Session = Depends(get_db)):
    """
    Execute a SQL SELECT query directly.
    
    Only SELECT queries are allowed - no data modification.
    This endpoint is for direct query execution without AI processing.
    """
    try:
        executor = SQLExecutor(db)
        result = executor.execute_select(request.query)
        
        return SQLExecuteResponse(
            success=result.get("success", False),
            columns=result.get("columns"),
            rows=result.get("rows"),
            row_count=result.get("row_count", 0),
            has_more=result.get("has_more", False),
            error=result.get("error"),
            query=result.get("query")
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"SQL execution failed: {str(e)}"
        )


@router.get("/health")
async def ai_health():
    """
    Check if the AI service is properly configured.
    """
    has_api_key = bool(ai_config.OPENROUTER_API_KEY)
    
    return {
        "status": "ok" if has_api_key else "not_configured",
        "api_key_configured": has_api_key,
        "model": ai_config.OPENROUTER_MODEL if has_api_key else None
    }
