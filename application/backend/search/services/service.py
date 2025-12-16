"""
Search service for tutor search functionality.
"""
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy import and_, or_, func, cast, String
from sqlalchemy.orm import Session
from datetime import date, time as time_type, timedelta

from ..models import TutorProfile, User, Course, TutorCourse, AvailabilitySlot
from admin.models.tutor_course_request import TutorCourseRequest

DEFAULT_TUTOR_IMAGE = "/media/default_silhouette.png"

def search_tutors(db: Session, params: Dict) -> Tuple[List[Dict[str, Any]], int]:
    """
    Search for tutors based on provided parameters.
    Returns tuple of (results as dicts, total_count).
    
    Supports filtering by:
    - Name (q, tutor_name)
    - Price range (min_rate, max_rate)
    - Languages (languages - comma-separated)
    - Departments (department, departments - comma-separated)
    - Course levels (course_levels - comma-separated)
    - Course number (course_number)
    - Availability (weekday, available_after, available_before, location_modes, has_availability)
    - Sorting (sort_by: price/name, sort_order: asc/desc)
    """
    # Base query: approved tutors only
    query = db.query(TutorProfile).join(User, TutorProfile.tutor_id == User.user_id)
    query = query.outerjoin(TutorCourse, TutorProfile.tutor_id == TutorCourse.tutor_id)
    query = query.outerjoin(Course, and_(
        TutorCourse.course_id == Course.course_id,
        Course.is_active == True
    ))
    
    # Check if availability filters are needed (conditional join)
    needs_availability = any([
        params.get("weekday") is not None,
        params.get("available_after") is not None,
        params.get("available_before") is not None,
        params.get("location_modes"),
        params.get("has_availability") is not None
    ])
    
    # Conditionally join AvailabilitySlot only when needed
    if needs_availability:
        # Calculate target date for weekday filter
        # If weekday is specified, find the next occurrence of that day
        # (this week if day hasn't passed, next week if it has)
        target_date = date.today()
        if params.get("weekday") is not None:
            selected_weekday = params["weekday"]  # 0=Sunday, 6=Saturday
            today = date.today()
            # Convert Python weekday (0=Monday) to DB weekday (0=Sunday)
            current_weekday = (today.weekday() + 1) % 7
            
            # Calculate days until selected weekday
            days_until = (selected_weekday - current_weekday) % 7
            if days_until == 0:
                # Same day - use today
                target_date = today
            else:
                target_date = today + timedelta(days=days_until)
        
        query = query.outerjoin(AvailabilitySlot, and_(
            TutorProfile.tutor_id == AvailabilitySlot.tutor_id,
            or_(
                AvailabilitySlot.valid_from == None,
                AvailabilitySlot.valid_from <= target_date
            ),
            or_(
                AvailabilitySlot.valid_until == None,
                AvailabilitySlot.valid_until >= target_date
            )
        ))
    
    # Build filters
    conditions = [TutorProfile.status == 'approved']
    
    # General search (q) - searches tutor names AND courses they teach
    if params.get("q"):
        search_term = f"%{params['q'].lower()}%"
        conditions.append(
            or_(
                # Tutor name matching
                func.lower(User.first_name).like(search_term),
                func.lower(User.last_name).like(search_term),
                func.lower(func.concat(User.first_name, ' ', User.last_name)).like(search_term),
                # Course matching - match if tutor teaches a course that matches the search
                func.lower(Course.title).like(search_term),
                func.lower(Course.department_code).like(search_term),
                func.lower(Course.course_number).like(search_term),
                func.lower(func.concat(Course.department_code, Course.course_number)).like(search_term),
                func.lower(func.concat(Course.department_code, ' ', Course.course_number)).like(search_term)
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
    
    # Price range filter
    if params.get("min_rate") is not None:
        conditions.append(TutorProfile.hourly_rate_cents >= params["min_rate"])
    if params.get("max_rate") is not None:
        conditions.append(TutorProfile.hourly_rate_cents <= params["max_rate"])
    
    # Language filter (comma-separated languages, OR logic)
    if params.get("languages"):
        languages_list = [lang.strip() for lang in params["languages"].split(",") if lang.strip()]
        if languages_list:
            language_conditions = []
            for lang in languages_list:
                # Match language in comma-separated string (case-insensitive)
                # Support matching at start, middle, or end of the languages string
                lang_lower = lang.lower()
                language_conditions.append(
                    or_(
                        func.lower(TutorProfile.languages).like(f"{lang_lower}%"),
                        func.lower(TutorProfile.languages).like(f"%, {lang_lower}%"),
                        func.lower(TutorProfile.languages).like(f"%{lang_lower},"),
                        func.lower(TutorProfile.languages).like(f"%{lang_lower}")
                    )
                )
            conditions.append(or_(*language_conditions))
    
    # Department filter - single or multiple (comma-separated)
    department_list = []
    if params.get("department"):
        department_list.append(params["department"].upper())
    if params.get("departments"):
        dept_list = [dept.strip().upper() for dept in params["departments"].split(",") if dept.strip()]
        department_list.extend(dept_list)
    
    if department_list:
        conditions.append(Course.department_code.in_(department_list))
    
    # Course level filter (course_levels - comma-separated, matches by prefix)
    if params.get("course_levels"):
        level_list = [level.strip() for level in params["course_levels"].split(",") if level.strip()]
        if level_list:
            level_conditions = []
            for level in level_list:
                # Match course numbers starting with the level digit (e.g., "1" matches 100-199)
                level_conditions.append(
                    cast(Course.course_number, String).like(f"{level}%")
                )
            conditions.append(or_(*level_conditions))
    
    # Course number filter
    if params.get("course_number"):
        conditions.append(Course.course_number == params["course_number"])
    
    # Availability filters
    if needs_availability:
        # Weekday filter
        if params.get("weekday") is not None:
            conditions.append(AvailabilitySlot.weekday == params["weekday"])
        
        # Time range filters
        # To find tutors available during a time range (e.g., 2-3 PM):
        # - Slot must start before or at the end of requested time (slot.start_time <= available_before)
        # - Slot must end after or at the start of requested time (slot.end_time >= available_after)
        # This ensures the slot overlaps with the requested time range
        if params.get("available_after") is not None:
            conditions.append(
                or_(
                    AvailabilitySlot.end_time >= params["available_after"],
                    AvailabilitySlot.end_time == None
                )
            )
        if params.get("available_before") is not None:
            conditions.append(
                or_(
                    AvailabilitySlot.start_time <= params["available_before"],
                    AvailabilitySlot.start_time == None
                )
            )
        
        # Location mode filter
        if params.get("location_modes"):
            location_list = [loc.strip().lower() for loc in params["location_modes"].split(",") if loc.strip()]
            if location_list:
                conditions.append(
                    func.lower(AvailabilitySlot.location_mode).in_([loc.lower() for loc in location_list])
                )
        
        # Has availability filter
        if params.get("has_availability") is True:
            conditions.append(AvailabilitySlot.slot_id != None)
    
    query = query.filter(and_(*conditions))
    
    # Get count
    total_count = query.distinct(TutorProfile.tutor_id).count()
    
    # Dynamic sorting
    sort_by = params.get("sort_by", "price").lower()
    sort_order = params.get("sort_order", "asc").lower()
    
    order_by_clauses = []
    if sort_by == "price":
        if sort_order == "desc":
            order_by_clauses.append(TutorProfile.hourly_rate_cents.desc())
        else:
            order_by_clauses.append(TutorProfile.hourly_rate_cents.asc())
    elif sort_by == "name":
        if sort_order == "desc":
            order_by_clauses.extend([User.last_name.desc(), User.first_name.desc()])
        else:
            order_by_clauses.extend([User.last_name.asc(), User.first_name.asc()])
    else:
        # Default: price ascending
        order_by_clauses.append(TutorProfile.hourly_rate_cents.asc())
    
    # Always add secondary sort by name for consistency
    if sort_by != "name":
        order_by_clauses.extend([User.last_name.asc(), User.first_name.asc()])
    
    # Order and paginate
    query = query.group_by(
        TutorProfile.tutor_id, 
        User.user_id, 
        TutorProfile.hourly_rate_cents,
        User.last_name, 
        User.first_name
    ).order_by(*order_by_clauses)
    
    # Execute query to get distinct tutor IDs first (avoids row duplication issues)
    # We only select the ID to ensure distinctness works on the ID level
    id_query = query.with_entities(TutorProfile.tutor_id)
    tutor_ids_result = id_query.offset(params["offset"]).limit(params["limit"]).all()
    tutor_ids = [r[0] for r in tutor_ids_result]
    
    # Fetch full tutor profiles for the found IDs
    if tutor_ids:
        # We need to join User again to access user details
        tutors = db.query(TutorProfile).join(User, TutorProfile.tutor_id == User.user_id)\
            .filter(TutorProfile.tutor_id.in_(tutor_ids)).all()
        
        # Sort tutors in Python to match the order of tutor_ids (since IN clause doesn't preserve order)
        tutor_map = {t.tutor_id: t for t in tutors}
        tutors = [tutor_map[tid] for tid in tutor_ids if tid in tutor_map]
    else:
        tutors = []
    
    # Build results as dicts
    results = []
    for tutor in tutors:
        user = tutor.user
        image_full = tutor.profile_image_path_full or DEFAULT_TUTOR_IMAGE
        image_thumb = tutor.profile_image_path_thumb or image_full
        
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
                "course_id": c.course_id,
                "department_code": c.department_code,
                "course_number": c.course_number,
                "title": c.title
            }
            for c in tutor_courses
        ]
        
        # Get availability slots for display if needed
        availability = []
        if needs_availability:
             # Fetch slots that matched the criteria or just all valid slots?
             # For display, we usually show generic availability or the matched ones.
             # Let's show a summary of their availability.
             slots = db.query(AvailabilitySlot).filter(
                 AvailabilitySlot.tutor_id == tutor.tutor_id,
                 or_(AvailabilitySlot.valid_from == None, AvailabilitySlot.valid_from <= date.today()),
                 or_(AvailabilitySlot.valid_until == None, AvailabilitySlot.valid_until >= date.today())
             ).all()
             
             # Format availability for display (e.g. "Mon 9am-5pm")
             day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
             for slot in slots:
                 if slot.weekday is not None and 0 <= slot.weekday <= 6:
                     start = slot.start_time.strftime("%I:%M%p").lstrip("0").lower() if slot.start_time else ""
                     end = slot.end_time.strftime("%I:%M%p").lstrip("0").lower() if slot.end_time else ""
                     availability.append(f"{day_names[slot.weekday]} {start}-{end}")
        
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
            "availability": availability[:3] if availability else [], # Limit to 3 slots for display
            "profile_image_path_thumb": image_thumb,
            "profile_image_path_full": image_full,
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
    
    # Department filter - single or multiple (comma-separated)
    department_list = []
    if params.get("department"):
        department_list.append(params["department"].upper())
    if params.get("departments"):
        dept_list = [dept.strip().upper() for dept in params["departments"].split(",") if dept.strip()]
        department_list.extend(dept_list)
    
    if department_list:
        conditions.append(Course.department_code.in_(department_list))
    
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


def get_filter_options(db: Session) -> Dict[str, Any]:
    """
    Get available filter options for the search UI.
    Returns departments, languages, price range, location modes, and weekdays.
    """
    # Get departments with counts
    departments_query = db.query(
        Course.department_code,
        func.count(func.distinct(TutorProfile.tutor_id)).label('count')
    ).join(
        TutorCourse, Course.course_id == TutorCourse.course_id
    ).join(
        TutorProfile, TutorCourse.tutor_id == TutorProfile.tutor_id
    ).filter(
        Course.is_active == True,
        TutorProfile.status == 'approved'
    ).group_by(Course.department_code).order_by(Course.department_code).all()
    
    departments = [
        {"code": row[0], "count": row[1]}
        for row in departments_query
    ]
    
    # Get languages with counts
    # We need to parse the comma-separated languages string
    tutors_with_languages = db.query(TutorProfile).filter(
        TutorProfile.status == 'approved',
        TutorProfile.languages != None,
        TutorProfile.languages != ''
    ).all()
    
    language_counts = {}
    for tutor in tutors_with_languages:
        languages = tutor.get_languages()
        for lang in languages:
            lang_normalized = lang.strip()
            if lang_normalized:
                language_counts[lang_normalized] = language_counts.get(lang_normalized, 0) + 1
    
    languages = [
        {"name": lang, "count": count}
        for lang, count in sorted(language_counts.items())
    ]
    
    # Get price range
    price_stats = db.query(
        func.min(TutorProfile.hourly_rate_cents).label('min_rate'),
        func.max(TutorProfile.hourly_rate_cents).label('max_rate')
    ).filter(
        TutorProfile.status == 'approved'
    ).first()
    
    price_range = {
        "min": price_stats[0] if price_stats[0] is not None else 0,
        "max": price_stats[1] if price_stats[1] is not None else 0
    }
    
    # Get location modes
    location_modes_query = db.query(
        AvailabilitySlot.location_mode,
        func.count(func.distinct(AvailabilitySlot.tutor_id)).label('count')
    ).join(
        TutorProfile, AvailabilitySlot.tutor_id == TutorProfile.tutor_id
    ).filter(
        TutorProfile.status == 'approved',
        AvailabilitySlot.location_mode != None,
        AvailabilitySlot.location_mode != '',
        or_(
            AvailabilitySlot.valid_from == None,
            AvailabilitySlot.valid_from <= date.today()
        ),
        or_(
            AvailabilitySlot.valid_until == None,
            AvailabilitySlot.valid_until >= date.today()
        )
    ).group_by(AvailabilitySlot.location_mode).all()
    
    location_modes = [
        {"mode": row[0], "count": row[1]}
        for row in location_modes_query if row[0]
    ]
    
    # Get weekdays
    weekdays_query = db.query(
        AvailabilitySlot.weekday,
        func.count(func.distinct(AvailabilitySlot.tutor_id)).label('count')
    ).join(
        TutorProfile, AvailabilitySlot.tutor_id == TutorProfile.tutor_id
    ).filter(
        TutorProfile.status == 'approved',
        or_(
            AvailabilitySlot.valid_from == None,
            AvailabilitySlot.valid_from <= date.today()
        ),
        or_(
            AvailabilitySlot.valid_until == None,
            AvailabilitySlot.valid_until >= date.today()
        )
    ).group_by(AvailabilitySlot.weekday).all()
    
    weekdays = [
        {"weekday": row[0], "count": row[1]}
        for row in weekdays_query
    ]
    
    return {
        "departments": departments,
        "languages": languages,
        "price_range": price_range,
        "location_modes": location_modes,
        "weekdays": weekdays
    }


def get_tutor_by_id(db: Session, tutor_id: int) -> Dict[str, Any] | None:
    """
    Fetch detailed information for a specific tutor by ID.
    
    Args:
        db: Database session
        tutor_id: ID of the tutor to fetch
        
    Returns:
        Dictionary with tutor details, or None if tutor not found or not approved.
    """
    # Query tutor with user info
    tutor = db.query(TutorProfile).join(
        User, TutorProfile.tutor_id == User.user_id
    ).filter(
        TutorProfile.tutor_id == tutor_id,
        TutorProfile.status == 'approved'
    ).first()
    
    if not tutor:
        return None
    
    # Get courses
    tutor_courses = db.query(Course).join(
        TutorCourse, Course.course_id == TutorCourse.course_id
    ).filter(
        TutorCourse.tutor_id == tutor_id,
        Course.is_active == True
    ).all()
    
    courses = [
        {
            "id": c.course_id,
            "course_id": c.course_id,
            "department_code": c.department_code,
            "course_number": c.course_number,
            "title": c.title
        }
        for c in tutor_courses
    ]

    image_full = tutor.profile_image_path_full or DEFAULT_TUTOR_IMAGE
    image_thumb = tutor.profile_image_path_thumb or image_full
    
    return {
        "id": tutor.tutor_id,
        "first_name": tutor.user.first_name,
        "last_name": tutor.user.last_name,
        "email": tutor.user.sfsu_email,
        "hourly_rate_cents": tutor.hourly_rate_cents,
        "bio": tutor.bio,
        "courses": courses,
        "languages": tutor.get_languages(),
        "avg_rating": None,  # TODO: Implement when reviews are added
        "sessions_completed": None,  # TODO: Implement when sessions are tracked
        "profile_image_path_full": image_full,
        "profile_image_path_thumb": image_thumb
    }


def add_tutor_course(db: Session, tutor_id: int, course_id: int) -> bool:
    """
    Add a course to a tutor's list of tutored courses.
    Returns True if added or already exists, False if error.
    """
    try:
        # Check if already exists
        existing = db.query(TutorCourse).filter(
            and_(
                TutorCourse.tutor_id == tutor_id,
                TutorCourse.course_id == course_id
            )
        ).first()
        
        if existing:
            return True
            
        new_tutor_course = TutorCourse(tutor_id=tutor_id, course_id=course_id)
        db.add(new_tutor_course)
        db.commit()
        return True
    except Exception as e:
        print(f"Error adding tutor course: {str(e)}")
        db.rollback()
        return False


def remove_tutor_course(db: Session, tutor_id: int, course_id: int) -> bool:
    """
    Remove a course from a tutor's list of tutored courses.
    Returns True if removed, False if not found or error.
    """
    try:
        tutor_course = db.query(TutorCourse).filter(
            and_(
                TutorCourse.tutor_id == tutor_id,
                TutorCourse.course_id == course_id
            )
        ).first()
        
        if not tutor_course:
            return False
            
        db.delete(tutor_course)
        db.commit()
        return True
    except Exception as e:
        print(f"Error removing tutor course: {str(e)}")
        db.rollback()
        return False


def request_tutor_course(db: Session, tutor_id: int, course_id: int):
    """
    Create a request for a tutor to add a course.
    Returns the request object or raises ValueError.
    """
    try:
        # Check if course exists
        course = db.query(Course).filter(Course.course_id == course_id).first()
        if not course:
            raise ValueError("Course not found")
            
        # Check if already has course
        existing = db.query(TutorCourse).filter(
            and_(
                TutorCourse.tutor_id == tutor_id,
                TutorCourse.course_id == course_id
            )
        ).first()
        if existing:
            raise ValueError("Tutor already serves this course")
            
        # Check if pending request exists
        pending = db.query(TutorCourseRequest).filter(
            and_(
                TutorCourseRequest.tutor_id == tutor_id, 
                TutorCourseRequest.course_id == course_id, 
                TutorCourseRequest.status == "pending"
            )
        ).first()
        
        if pending:
            return pending
            
        request = TutorCourseRequest(tutor_id=tutor_id, course_id=course_id)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request
    except Exception as e:
        print(f"Error requesting tutor course: {str(e)}")
        db.rollback()
        raise e
