"""
Pydantic schemas for report responses.
"""
from pydantic import BaseModel
from datetime import datetime

class ReportInfo(BaseModel):
    report_id: int
    reporter_id: int
    reported_user_id: int
    reason: str
    created_at: datetime

class ReportResponse(BaseModel):
    message_id: int
    reporter_id: int
    reported_user_id: int
    reason: str
    status:str
    created_at: datetime
