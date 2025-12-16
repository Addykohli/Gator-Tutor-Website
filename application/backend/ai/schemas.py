"""
Pydantic schemas for the AI service API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AIQueryRequest(BaseModel):
    """Request schema for AI queries."""
    prompt: str = Field(..., description="The natural language query to process")
    user_id: Optional[int] = Field(None, description="ID of the logged-in user for personalized responses")
    user_role: Optional[str] = Field(None, description="Role of the logged-in user (student, tutor, admin)")
    

class QueryExecution(BaseModel):
    """Details of a SQL query execution."""
    query: str
    success: bool
    row_count: Optional[int] = 0
    rows: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class AIQueryResponse(BaseModel):
    """Response schema for AI queries."""
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    queries_executed: List[QueryExecution] = []
    function_calls: int = 0


class SchemaInfoResponse(BaseModel):
    """Response schema for database schema information."""
    success: bool
    schema_info: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class SQLExecuteRequest(BaseModel):
    """Request schema for direct SQL execution (admin only)."""
    query: str = Field(..., description="The SELECT SQL query to execute")


class SQLExecuteResponse(BaseModel):
    """Response schema for SQL execution results."""
    success: bool
    columns: Optional[List[str]] = None
    rows: Optional[List[Dict[str, Any]]] = None
    row_count: int = 0
    has_more: bool = False
    error: Optional[str] = None
    query: Optional[str] = None
