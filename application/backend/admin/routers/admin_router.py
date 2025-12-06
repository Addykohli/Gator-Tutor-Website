from admin.schemas.report_schema import ReportInfo, ReportResponse, ReportCreate
from admin.services.admin_service import get_all_reports, get_user_reports, create_report, get_user_id_by_name
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from search.database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])

#post report
@router.post("/report", response_model=ReportResponse)
def create_report_endpoint(data:ReportCreate, db:Session=Depends(get_db)):
    return create_report(db,data)

#GET reports
@router.get("/allreports", response_model=list[ReportResponse])
def get_reports_endpoint(db:Session = Depends(get_db)):
    return get_all_reports(db)

#get user specific report
@router.get("/userreports", response_model=list[ReportResponse])
def get_user_reports_endpoint(user_id: int = Query(None), name: str = Query(None), db: Session = Depends(get_db)):
    if name:
        found_user_id = get_user_id_by_name(db, name)
        if not found_user_id:
            return [] 
        return get_user_reports(db, found_user_id)
    
    if user_id:
        return get_user_reports(db, user_id)
        
    return get_all_reports(db)