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
router = APIRouter(prefix="/api/admin", tags=["admin"])
#----------------------------------------------------------
# Admin Manage Tutors(& Tutor Courses) Endpiints
#Todo: manage tutors endpoints/services needed:
# X promote, student to tutor
# x demote tutor to student
# delete inactive user accounts
#   -> this probably falls under  "drop a student" task
# X list/approve/reject aditional courses for tutor to tutor_courses
# remove courses from tutor_courses


#promote student to tutor role, add student to tutor_profiles
@router.post("/promote/{user_id}", response_model = TutorProfileResponse)
def promotion_endpoint(user_id:int, db:Session=Depends(get_db)):
    return promote_to_tutor(db, user_id)
#change tutor user to student user only, removes tutor_profile
@router.patch("/demote/{user_id}")
def demote_tutor_endpoint(user_id:int, db: Session = Depends(get_db)):
    return demote_to_student_only(db, user_id)

# GET admin list all requests
@router.get("/all-tutor-course-requests", response_model=list[TutorCourseRequestResponse])
def list_all_requests(db: Session = Depends(get_db)):
    return get_all_tutor_course_requests(db)
   
# tutor makes request to add course to tutor_courses
@router.post("/tutor-course-request/{tutor_id}", response_model=TutorCourseRequestResponse)
def tutor_create_request(tutor_id: int, data: TutorCourseRequestCreate, db: Session = Depends(get_db)):
    return create_tutor_course_request(db, tutor_id, data)

# changes approves request status, adds course to tutor_courses
@router.patch("/tutor-course-request/{request_id}/approve", response_model=TutorCourseRequestResponse)
def approve_request(request_id: int, db: Session = Depends(get_db)):
    return approve_tutor_course_request(db, request_id)

# admin changes request status to rejected
@router.patch("/tutor-course-request/{request_id}/reject", response_model=TutorCourseRequestResponse)
def reject_request(request_id: int, db: Session = Depends(get_db)):
    return reject_tutor_course_request(db, request_id)

#admin can remove a tutor_course
@router.delete("/tutor/{tutor_id}/course/{course_id}")
def admin_remove_tutor_course(tutor_id: int, course_id: int, db: Session = Depends(get_db)):
    return remove_tutor_course(db, tutor_id, course_id)

#----------------------------------------------------------
# Admin Manage Courses Endpoints
#note: only courses, not tutor_courses

#get list of all DB courses for admin ease
@router.get("/allcourses", response_model=list[CourseResponse])
def list_courses_endpoint(db:Session=Depends(get_db)):
    return get_all_courses(db)

#add courses to DB by admin
@router.post("/addcourse", response_model=CourseResponse)
def add_course_endpoint(data: CourseCreate, db:Session=Depends(get_db)):
    return create_course(db, data)

#change course status from active to inactive in DB
@router.patch("/deactivate/{course_id}", response_model=CourseResponse)
def deactivate_course_endpoint(course_id:int, db:Session= Depends(get_db)):
    return deactivate_course(db, course_id)


#----------------------------------------------------------
# Report(complaints/issues) Enpoints

#post report
@router.post("/report", response_model=ReportResponse)
def create_report_endpoint(data:ReportCreate, db:Session=Depends(get_db)):
    return create_report(db,data)

#GET reports
@router.get("/allreports", response_model=list[ReportResponse])
def get_reports_endpoint(db:Session = Depends(get_db)):
    return get_all_reports(db)

#get user specific report- post merge with addys changes
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

#a way to update report status
@router.patch("/report/{report_id}/status", response_model= ReportResponse)
def update_report_endpoint(report_id:int, status:str, db:Session=Depends(get_db)):
    return update_report_status(db, report_id, status)
