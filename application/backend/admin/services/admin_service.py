from admin.models.reports import Reports
from admin.schemas.report_schema import ReportInfo
from admin.models.tutor_course_request import TutorCourseRequest

from search.models.course import Course
from search.models.user import User
from search.models.tutor_profile import TutorProfile
from search.models.tutor_course import TutorCourse
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import or_, func
#----------------------------------------------------------
# Admin: Manage tutors

#Promote:student to tutor
#add to tutor_profile based on application inputs 
def promote_to_tutor(db:Session, user_id:int):
    user = db.query(User).filter(User.user_id ==user_id).first()
    if not user:
        raise HTTPException(404,"user not found")
    
    if user.role == "tutor":
        raise HTTPException(400,"user is already a tutor")
    
    #update role in users db table
    user.role="tutor"

    #add to tutor_profile db table
    profile = TutorProfile(
        tutor_id = user.user_id,
        bio=None,
        hourly_rate_cents=0,
        languages=None,
        status="approved"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

#Demote: tutor to student only role
def demote_to_student_only(db: Session, user_id:int):
    user = db.query(User).filter(User.user_id==user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")
    
    # If user is already a student, just return - no error
    if user.role != "tutor":
        return {"message": f"user {user_id} is already a student"}
    
    #change role in user db table
    user.role = "student"
    profile = db.query(TutorProfile).filter(TutorProfile.tutor_id == user_id).first()
    #remove corresponding table entry from tutor_profile
    if profile:
        db.delete(profile)

    db.commit()
    return {"message": f"user {user_id} demoted to student and tutor_profile removed."}


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

#for admin adding more courses to db(related to course request management)
def create_course(db:Session, data):
    #check if course being attempted is already a course listing 
    course_listing = db.query(Course).filter(
        Course.department_code == data.department_code,
        Course.course_number == data.course_number,
    ).first() 

    if course_listing:
        raise HTTPException(400, "Already a course listing.")
    
    new_course = Course(
        department_code= data.department_code,
        course_number= data.course_number,
        title= data.title
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

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

def create_report(db:Session, data:ReportInfo):
    report = Reports(
        reporter_id = data.reporter_id,
        reported_user_id = data.reported_user_id,
        reason = data.reason
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
def update_report_status(db, report_id, status):
    report = db.query(Reports).filter(Reports.report_id ==report_id).first()
    if not report:
        raise HTTPException(404,"report not found")
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