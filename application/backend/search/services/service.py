"""
Search service for tutor search functionality.
"""
from typing import List, Tuple, Dict, Any
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from ..models import TutorProfile, User, Course, TutorCourse


def search_tutors(db: Session, params: Dict) -> Tuple[List[Dict[str, Any]], int]:
    """
    Search for tutors based on provided parameters.
    Returns tuple of (results as dicts, total_count).
    """
    # Base query: approved tutors only
    query = db.query(TutorProfile).join(User, TutorProfile.tutor_id == User.user_id)
    query = query.outerjoin(TutorCourse, TutorProfile.tutor_id == TutorCourse.tutor_id)
    query = query.outerjoin(Course, and_(
        TutorCourse.course_id == Course.course_id,
        Course.is_active == True
    ))
    
    # Build filters
    conditions = [TutorProfile.status == 'approved']
    
    # General search (q) - only searches tutor names (not courses)
    # NOTE: LIKE queries with leading % won't use indexes efficiently.
    # For better performance at scale, consider:
    # - Prefix matching (no leading %) when possible
    # - MySQL FULLTEXT indexes
    # - Search engines (Elasticsearch, etc.) for large datasets
    if params.get("q"):
        search_term = f"%{params['q'].lower()}%"
        conditions.append(
            or_(
                func.lower(User.first_name).like(search_term),
                func.lower(User.last_name).like(search_term),
                func.lower(func.concat(User.first_name, ' ', User.last_name)).like(search_term)
            )
        )
    
    # Tutor name search
    if params.get("tutor_name"):
        name_term = f"%{params['tutor_name'].lower()}%"
        conditions.append(
            or_(
                func.lower(User.first_name).like(name_term),
                func.lower(User.last_name).like(name_term),
                func.lower(func.concat(User.first_name, ' ', User.last_name)).like(name_term)
            )
        )
    
    # Department filter - filters tutors by courses they teach
    if params.get("department"):
        conditions.append(Course.department_code == params["department"])
    
    # Course number filter - filters tutors by courses they teach
    if params.get("course_number"):
        conditions.append(Course.course_number == params["course_number"])
    
    query = query.filter(and_(*conditions))
    
    # Get count
    total_count = query.distinct(TutorProfile.tutor_id).count()
    
    # Order and paginate (removed TutorMetric columns)
    query = query.group_by(
        TutorProfile.tutor_id, 
        User.user_id, 
        TutorProfile.hourly_rate_cents,
        User.last_name, 
        User.first_name
    ).order_by(
        TutorProfile.hourly_rate_cents.asc(),
        User.last_name.asc(),
        User.first_name.asc()
    )
    
    tutors = query.offset(params["offset"]).limit(params["limit"]).all()
    
    # Build results as dicts
    results = []
    for tutor in tutors:
        user = tutor.user
        
        # Get courses
        tutor_courses = db.query(Course).join(
            TutorCourse, Course.course_id == TutorCourse.course_id
        ).filter(
            and_(
                TutorCourse.tutor_id == tutor.tutor_id,
                Course.is_active == True
            )
        ).all()
        
        courses = [
            {
                "department_code": c.department_code,
                "course_number": c.course_number,
                "title": c.title
            }
            for c in tutor_courses
        ]
        
        # Metrics not available - set to None
        results.append({
            "tutor_id": tutor.tutor_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hourly_rate_cents": tutor.hourly_rate_cents,
            "languages": tutor.get_languages() if tutor.languages else [],
            "avg_rating": None,
            "sessions_completed": None,
            "courses": courses,
            "profile_image_path_thumb": tutor.profile_image_path_thumb,
            "profile_image_path_full": tutor.profile_image_path_full
        })
    
    return results, total_count


def search_courses(db: Session, params: Dict) -> Tuple[List[Dict[str, Any]], int]:
    """
    Search for courses based on provided parameters.
    Returns tuple of (results as dicts, total_count).
    """
    # Base query: active courses only
    query = db.query(Course)
    
    # Build filters
    conditions = [Course.is_active == True]
    
    # General search (q) - searches course title, department, course number
    # NOTE: LIKE queries with leading % won't use indexes efficiently.
    # See note in search_tutors() for optimization strategies.
    if params.get("q"):
        search_term = f"%{params['q'].lower()}%"
        conditions.append(
            or_(
                func.lower(Course.title).like(search_term),
                func.lower(Course.department_code).like(search_term),
                func.lower(Course.course_number).like(search_term),
                func.lower(func.concat(Course.department_code, Course.course_number)).like(search_term),
                func.lower(func.concat(Course.department_code, ' ', Course.course_number)).like(search_term)
            )
        )
    
    # Department filter
    if params.get("department"):
        conditions.append(Course.department_code == params["department"].upper())
    
    # Course number filter
    if params.get("course_number"):
        conditions.append(Course.course_number == params["course_number"])
    
    query = query.filter(and_(*conditions))
    
    # Get count of courses
    total_count = query.count()
    
    # Order and paginate
    query = query.order_by(
        Course.department_code.asc(),
        Course.course_number.asc()
    )
    
    courses = query.offset(params["offset"]).limit(params["limit"]).all()
    
    # Build results as dicts with tutor count
    # OPTIMIZATION: Batch count tutors for all courses in one query instead of N+1 queries
    course_ids = [course.course_id for course in courses]
    tutor_counts = {}
    
    if course_ids:
        # Single query to count tutors for all courses at once
        counts = db.query(
            TutorCourse.course_id,
            func.count(TutorCourse.tutor_id).label('tutor_count')
        ).join(
            TutorProfile, TutorCourse.tutor_id == TutorProfile.tutor_id
        ).filter(
            TutorCourse.course_id.in_(course_ids),
            TutorProfile.status == 'approved'
        ).group_by(TutorCourse.course_id).all()
        
        # Extract course_id and count from SQLAlchemy Row objects
        tutor_counts = {row[0]: row[1] for row in counts}
    
    results = []
    for course in courses:
        tutor_count = tutor_counts.get(course.course_id, 0)
        
        results.append({
            "course_id": course.course_id,
            "department_code": course.department_code,
            "course_number": course.course_number,
            "title": course.title,
            "tutor_count": tutor_count
        })
    
    return results, total_count

