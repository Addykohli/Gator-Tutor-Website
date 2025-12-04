"""
Pydantic schemas for report responses.
"""
from pydantic import BaseModel
from datetime import datetime

class ReportCreate(BaseModel):
    reporter_id: int
    reported_user_id: int
    reason: str

class ReportInfo(BaseModel):
    report_id: int
    reporter_id: int
    reported_user_id: int
    reason: str

class ReportResponse(BaseModel):
    report_id: int
    reporter_id: int
    reported_user_id: int
    reason: str
    status:str
    created_at: datetime