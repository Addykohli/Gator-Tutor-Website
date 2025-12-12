from admin.schemas.report_schema import ReportCreate, ReportResponse
from admin.schemas.course_schema import CourseCreate, CourseResponse
from admin.schemas.course_request_schema import CourseRequestCreate, CourseRequestResponse, CourseUpdate
from admin.schemas.tutor_schema import TutorProfileResponse
from admin.models.tutor_application import TutorApplication
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from search.database import get_db
from auth.services.auth_service import get_user
from admin.schemas.tutor_course_schema import TutorCourseRequestCreate, TutorCourseRequestResponse
from admin.schemas.tutor_application_schema import TutorApplicationCreate, TutorApplicationResponse, TutorApplicationUpdateStatus
from admin.services.admin_service import (
    create_tutor_course_request,
    get_all_tutor_course_requests,
    approve_tutor_course_request,
    reject_tutor_course_request,
    remove_tutor_course,
    create_application,
    approve_application,
    reject_application,
    create_course_request,
    get_all_course_requests,
    update_course_request_status
)
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["admin"])

#----------------------------------------------------------
# Tutor Application Endpoints (for students/tutors applying)

# Submit a tutor application
@router.post("/tutor-applications", response_model=TutorApplicationResponse)
def submit_application(data: TutorApplicationCreate, db: Session = Depends(get_db)):
    return create_application(db, data)

# gets all tutor applications for admin view
@router.get("/all-tutor-applications")
def get_all_tutor_applications(db: Session = Depends(get_db)):
    apps = db.query(TutorApplication).order_by(TutorApplication.created_at.desc()).all()
    return {"items": [TutorApplicationResponse.from_orm(app) for app in apps]}

#updates status of tutor_application entry(if approved, adds tutor_profile entry)
@router.patch("/tutor-applications/{application_id}/status", response_model=TutorApplicationResponse)
def update_status(application_id: int, body: TutorApplicationUpdateStatus, db: Session = Depends(get_db)):
    if body.status == "approved":
        updated = approve_application(db, application_id)
    elif body.status == "rejected":
        updated = reject_application(db, application_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    return updated

#-------------------------------------------------------------------
# ADMIN: Course Coverage Requests

# for admin to see all course_coverage_requests
@router.get("/all-coverage-requests", response_model=list[CourseRequestResponse])
def list_course_requests(db: Session = Depends(get_db)):
    return get_all_course_requests(db)

#submit a course_coverage_request and add entry to table
@router.post("/submit-coverage-request")
def submit_create_course_request(data: CourseRequestCreate, db: Session = Depends(get_db)):
    return create_course_request(db, data)

    #return create_course_request(db, user_id, data)
#updates the status to the course request table, and adds an entry to courses
@router.patch("/coverage-request/{request_id}/status", response_model=CourseRequestResponse)
def update_status(request_id: int, data: CourseUpdate, db: Session = Depends(get_db)):
    return update_course_request_status(db, request_id, data.status)



@router.get("/debug/courses")
async def list_all_courses(db: Session = Depends(get_db)):
    from search.models.course import Course
    try:
        courses = db.query(Course).all()
        return [{"code": c.code, "name": c.name, "department": c.department} for c in courses]
    except Exception as e:
        return {"error": str(e)}

@router.get("/allcourses")
async def get_all_courses(db: Session = Depends(get_db)):
    """Get all courses for the course catalog"""
    from search.models.course import Course
    try:
        courses = db.query(Course).all()
        return [{
            "course_id": c.course_id,
            "department_code": c.department_code,
            "course_number": c.course_number,
            "title": c.title,
            "is_active": c.is_active if hasattr(c, 'is_active') else True
        } for c in courses]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses: {str(e)}")
#----------------------------------------------------------
# Tutor Course Request Endpoints (Restored)

@router.get("/all-tutor-course-requests", response_model=list[TutorCourseRequestResponse])
def get_all_requests(db: Session = Depends(get_db)):
    return get_all_tutor_course_requests(db)

@router.post("/tutor-course-request", response_model=TutorCourseRequestResponse)
def new_tutor_course_request(request: TutorCourseRequestCreate, db: Session = Depends(get_db)):
    return create_tutor_course_request(db=db, tutor_id=request.tutor_id, data=request)

@router.patch("/tutor-course-request/{request_id}/approve")
def approve_request(request_id: int, db: Session = Depends(get_db)):
    return approve_tutor_course_request(db=db, request_id=request_id)

@router.patch("/tutor-course-request/{request_id}/reject")
def reject_request(request_id: int, db: Session = Depends(get_db)):
    return reject_tutor_course_request(db=db, request_id=request_id)

@router.delete("/remove-tutor-course")
def remove_course(tutor_id: int, course_id: int, db: Session = Depends(get_db)):
    return remove_tutor_course(db=db, tutor_id=tutor_id, course_id=course_id)

#----------------------------------------------------------
# Reports Endpoints

@router.get("/allreports")
def get_all_reports(db: Session = Depends(get_db)):
    """Get all reports with user information"""
    from admin.models.reports import Reports
    from search.models.user import User
    
    try:
        reports = db.query(Reports).order_by(Reports.created_at.desc()).all()
        
        enriched_reports = []
        for report in reports:
            # Get reporter info
            reporter = db.query(User).filter(User.user_id == report.reporter_id).first()
            reporter_name = f"{reporter.first_name} {reporter.last_name}".strip() if reporter else f"User #{report.reporter_id}"
            reporter_email = reporter.sfsu_email if reporter else ""
            
            # Get reported user info
            reported_user = db.query(User).filter(User.user_id == report.reported_user_id).first()
            reported_user_name = f"{reported_user.first_name} {reported_user.last_name}".strip() if reported_user else f"User #{report.reported_user_id}"
            reported_user_email = reported_user.sfsu_email if reported_user else ""
            
            enriched_reports.append({
                "report_id": report.report_id,
                "reporter_id": report.reporter_id,
                "reporter_name": reporter_name,
                "reporter_email": reporter_email,
                "reported_user_id": report.reported_user_id,
                "reported_user_name": reported_user_name,
                "reported_user_email": reported_user_email,
                "reason": report.reason,
                "status": report.status,
                "created_at": report.created_at.isoformat() if report.created_at else None
            })
        
        return enriched_reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")