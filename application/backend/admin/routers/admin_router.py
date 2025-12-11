from admin.schemas.report_schema import ReportCreate, ReportResponse
from admin.schemas.course_schema import CourseCreate, CourseResponse
from admin.schemas.tutor_schema import TutorProfileResponse
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from search.database import get_db
from admin.schemas.tutor_course_schema import TutorCourseRequestCreate, TutorCourseRequestResponse, CourseInfo, UserInfo
from admin.services.admin_service import (
    get_all_reports, 
    get_user_reports,
    create_report, 
    update_report_status,
    get_all_courses,
    create_course,
    deactivate_course,
    promote_to_tutor,
    demote_to_student_only,
    get_user_id_by_name,
    create_tutor_course_request,
    get_all_tutor_course_requests,
    approve_tutor_course_request,
    reject_tutor_course_request,
    remove_tutor_course
)
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["admin"])

# In-memory storage for tutor applications (replace with database in production)
tutor_applications_store = []
application_id_counter = 0

class TutorApplicationCreate(BaseModel):
    user_id: int
    gpa: float
    courses: str
    bio: str
    availability: Optional[str] = None

class TutorApplicationStatusUpdate(BaseModel):
    status: str

# ... (keep all your existing endpoints) ...

#----------------------------------------------------------
# Tutor Application Endpoints (for students/tutors applying)

@router.post("/tutor-applications")
def create_tutor_application(application: TutorApplicationCreate):
    global application_id_counter
    application_id_counter += 1
    new_application = {
        "id": application_id_counter,
        "user_id": application.user_id,
        "gpa": application.gpa,
        "courses": application.courses,
        "bio": application.bio,
        "availability": application.availability,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    tutor_applications_store.append(new_application)
    return new_application

@router.get("/tutor-applications")
def get_tutor_applications():
    return tutor_applications_store

@router.patch("/tutor-applications/{application_id}/status")
def update_tutor_application_status(application_id: int, update: TutorApplicationStatusUpdate):
    for app in tutor_applications_store:
        if app["id"] == application_id:
            app["status"] = update.status
            return app
    raise HTTPException(status_code=404, detail="Application not found")

# In-memory storage for coverage requests (replace with database in production)
coverage_requests_store = []

@router.get("/coverage-requests")
async def get_coverage_requests():
    """Get all coverage requests for admin review"""
    return {"requests": coverage_requests_store}

@router.post("/coverage-requests")
async def create_coverage_request(request: dict):
    """Create a new coverage request (from students/tutors)"""
    import uuid
    from datetime import datetime
    
    new_request = {
        "id": str(uuid.uuid4()),
        "course_number": request.get("courseNumber", ""),
        "topics": request.get("topics", ""),
        "notes": request.get("notes", ""),
        "email": request.get("email", ""),
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    coverage_requests_store.append(new_request)
    return {"message": "Coverage request submitted successfully", "request": new_request}

@router.patch("/coverage-requests/{request_id}/status")
async def update_coverage_request_status(request_id: str, body: dict):
    """Update coverage request status (approve/reject)"""
    new_status = body.get("status")
    if new_status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    for req in coverage_requests_store:
        if req["id"] == request_id:
            req["status"] = new_status
            return {"message": f"Request {new_status}", "request": req}
    
    raise HTTPException(status_code=404, detail="Request not found")