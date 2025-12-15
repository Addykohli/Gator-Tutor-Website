from admin.models.reports import Reports
from admin.schemas.report_schema import ReportInfo
from admin.models.tutor_course_request import TutorCourseRequest
from admin.models.tutor_application import TutorApplication
from admin.models.course_request import CourseRequest
from admin.schemas.course_request_schema import CourseRequestCreate
from admin.schemas.tutor_application_schema import TutorApplicationCreate
from search.models.course import Course
from search.models.user import User
from search.models.tutor_profile import TutorProfile
from search.models.tutor_course import TutorCourse
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import or_, func
from schedule.models.booking import Booking
from schedule.models.availability_slot import AvailabilitySlot
from chat.models.chat_message import ChatMessage
from chat.models.chat_media import ChatMedia
import re

DEFAULT_TUTOR_IMAGE = "/static/images/default_photo.jpg"
#----------------------------------------------------------
# Admin: Manage tutors

# Create a tutor application(submitted via student)
def create_application(db: Session, data: TutorApplicationCreate):
    application = TutorApplication(**data.dict())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

# ADMIN: Approve a tutor application
def approve_application(db: Session, application_id: int):
    app = db.query(TutorApplication).filter(TutorApplication.application_id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail=f"Application already {app.status}")

    # Update status in tutor_applications table
    app.status = "approved"

    # adds an entry to tutor_profile table
    tutor_profile = TutorProfile(
        tutor_id=app.user_id,
        bio=app.bio,
        status="approved",
        profile_image_path_full=DEFAULT_TUTOR_IMAGE,
        profile_image_path_thumb=DEFAULT_TUTOR_IMAGE
    )
    db.add(tutor_profile)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    db.refresh(app)
    return app

# Reject a tutor application
def reject_application(db: Session, application_id: int):
    app = db.query(TutorApplication).filter(TutorApplication.application_id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    if app.status != "pending":
        raise HTTPException(status_code=400, detail=f"Application already {app.status}")
    app.status = "rejected"
    db.commit()
    db.refresh(app)
    return app



#--------------------------------------------------------------------
# Admin: Manage Tutor_Courses
#for admin to view all tutor course requests, ordered by creation time
def get_all_tutor_course_requests(db:Session):
    return db.query(TutorCourseRequest).order_by(TutorCourseRequest.created_at.desc()).all()

#tutor will send request to admin to add more courses to tutor_courses
def create_tutor_course_request(db: Session, tutor_id: int, data):
    tutor = db.query(TutorProfile).filter(TutorProfile.tutor_id == tutor_id).first()
    if not tutor:
        raise HTTPException(status_code=404, detail="tutor not found")

    course = db.query(Course).filter(Course.course_id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="course not found")

    #adds the course request to tutor_course_requests table 
    course_request = TutorCourseRequest(tutor_id=tutor_id, course_id=data.course_id)
    db.add(course_request)
    db.commit()
    db.refresh(course_request)
    return course_request

#change tutor_course request to approved, add course to tutor_courses
def approve_tutor_course_request(db: Session, request_id: int):
    request = db.query(TutorCourseRequest).filter(TutorCourseRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="request not found")

    # stop if already approved/rejected
    if request.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {request.status}")
    
    #course already added in tutor_courses
    tutor_course = db.query(TutorCourse).filter_by(tutor_id=request.tutor_id, course_id=request.course_id).first()
    if tutor_course:
        raise HTTPException(
            status_code=400,
            detail="tutor already has this course approved and added."
        )

    #changes status of entry in tutor_course_request table
    request.status = "approved"

    #adds entry to tutor_courses table in db
    new_tutor_course = TutorCourse(tutor_id=request.tutor_id, course_id=request.course_id)
    db.add(new_tutor_course)
    db.commit()
    db.refresh(request)
    return request

#only changes status to rejected in tutor_course_request table
def reject_tutor_course_request(db: Session, request_id: int):
    request = db.query(TutorCourseRequest).filter(TutorCourseRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    #changes status in tutor_course_request table
    request.status = "rejected"
    db.commit()
    db.refresh(request)
    return request

#for admin to remove tutor_course entry that already exists
def remove_tutor_course(db: Session, tutor_id: int, course_id: int):
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.tutor_id == tutor_id).first()
    if not tutor_profile:
        raise HTTPException(status_code=404, detail="Tutor not found")

    tutor_user = db.query(User).filter(User.user_id == tutor_id).first()

    course = db.query(Course).filter(Course.course_id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    #check that tutor is connected to this course already.
    tutor_course = (db.query(TutorCourse).filter(TutorCourse.tutor_id == tutor_id, TutorCourse.course_id == course_id).first())
    if not tutor_course:
        raise HTTPException(
            status_code=404,
            detail="Not currently a tutor of this course"
        )

    # remove entry from tutor_course table 
    db.delete(tutor_course)
    db.commit()

    return {
        "detail": "Tutor's course removed.",
        "tutor_id": tutor_id,
        "tutor_name": f"{tutor_user.first_name} {tutor_user.last_name}" if tutor_user else None,
        "course_id": course_id,
        "removed_course_title": course.title
    }


#----------------------------------------------------------
# Admin: Manage Courses
# only courses, not tutor_courses

#for admin viewing of all courses
def get_all_courses(db:Session):
    return db.query(Course).order_by(Course.department_code, Course.course_number).all()

#for admin to easily view all course requests
def get_all_course_requests(db: Session):
    return db.query(CourseRequest).all()

#adding course_request entry to db table
def create_course_request(db: Session, data: CourseRequestCreate):
    # get user by email
    user = db.query(User).filter(User.sfsu_email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    course_request = CourseRequest(
        course_number=data.course_number,
        title=data.title,
        notes=data.notes,
        user_id=user.user_id
    )

    db.add(course_request)
    db.commit()
    db.refresh(course_request)
    return course_request


#for admin adding more courses to db(related to course request management)
def update_course_request_status(db: Session, request_id: int, status: str):
    course_req = db.query(CourseRequest).filter(
        CourseRequest.course_req_id == request_id
    ).first()

    if not course_req:
        raise HTTPException(status_code=404, detail="Request not found")

    if course_req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {course_req.status}")

    course_req.status = status
    # Add to courses table if approved, update status in course_req
    if status == "approved":
        import re
        match = re.match(r"([A-Za-z]+)\s*[-]?\s*(\d+)", course_req.course_number)

        if not match:
            raise HTTPException(status_code=400, detail="Invalid course_number format")

        dept_code, course_num = match.groups()
        existing_course = db.query(Course).filter(Course.department_code == dept_code, Course.course_number == course_num).first()
        if not existing_course:
            new_course = Course(
                department_code=dept_code,
                course_number=course_num,
                title=course_req.title or "TBD",
                is_active=True
            )
            db.add(new_course)

    db.commit()
    db.refresh(course_req)
    return course_req



#update course status to active/inactive (some SFSU courses are based on semester)
def deactivate_course(db:Session, course_id:int):
    course = db.query(Course).filter(Course.course_id==course_id).first()
    if not course:
        raise HTTPException(404,"Course not found.")
    course.is_active = False
    db.commit()
    return course

    
#----------------------------------------------------------
# Admin: Reports

def create_report(db: Session, data: ReportInfo):
    report = Reports(
        reporter_id=data.reporter_id,
        reported_user_id=data.reported_user_id,
        reason=data.reason
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


#all reports for all users
def get_all_reports(db:Session):
    return db.query(Reports).order_by(Reports.created_at.desc()).all()

#user specific reports
def get_user_reports(db:Session, user_id:int):
    return db.query(Reports).filter(Reports.reported_user_id==user_id).all()

# update the status of reports so its easier for admin to keep manage reports rather 
# that just have a list of reports and not knowing what has been addressed.
# Frontend could provide visual indicator of reports status for easier on platform management.
# (submitted, reviewing, closed)
def update_report_status(db: Session, report_id: int, status: str):
    if status not in {"submitted", "reviewing", "closed"}:
        raise HTTPException(400, "Invalid status")

    report = db.query(Reports).filter(Reports.report_id == report_id).first()
    if not report:
        raise HTTPException(404, "Report not found")

    report.status = status
    db.commit()
    db.refresh(report)
    return report


def get_user_id_by_name(db: Session, name: str):
    # Case-insensitive search for first or last name
    user = db.query(User).filter(
        or_(
            func.lower(User.first_name).contains(func.lower(name)),
            func.lower(User.last_name).contains(func.lower(name))
        )
    ).first()
    return user.user_id if user else None

#----------------------------------------------------------
# Admin: Drop/Delete User

def drop_user(db: Session, user_id: int, role: str = None):
    """
    Soft delete a user by setting is_deleted flag.
    Preserves all related records for historical data.
    
    Args:
        db: Database session
        user_id: ID of the user to delete
        role: Optional role verification (tutor, student, admin, both)
    
    Returns:
        Dictionary with deletion details
    """
    # Find the user
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify role if provided
    if role and user.role != role:
        raise HTTPException(
            status_code=400, 
            detail=f"User role mismatch. Expected {role}, but user has role {user.role}"
        )
    
    user_email = user.sfsu_email
    user_name = f"{user.first_name} {user.last_name}"
    user_role = user.role
    
    # Soft delete: set the flag
    user.is_deleted = True
    
    # Anonymize email to prevent reuse (keeps unique constraint happy)
    user.sfsu_email = f"deleted_{user_id}_{user.sfsu_email}"
    
    # If tutor, deactivate their profile
    if user.role in ["tutor", "both"]:
        tutor_profile = db.query(TutorProfile).filter(
            TutorProfile.tutor_id == user_id
        ).first()
        if tutor_profile:
            tutor_profile.status = "rejected"  # Hide from search
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {user_name} ({user_email}) successfully deleted",
        "deleted_user_id": user_id,
        "deleted_email": user.sfsu_email,
        "deleted_name": user_name,
        "deleted_role": user_role
    }