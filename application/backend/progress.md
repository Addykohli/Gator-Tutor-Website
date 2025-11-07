# Backend Progress Tracker

## Core Files

### `config.py` - Configuration Management
**Why:** Centralized settings from environment variables  
**How:** Uses `python-dotenv` to load `.env`, provides `Settings` class with database URLs, cache, API config  
**Unique:** Auto-switches between dev/prod DB based on `ENVIRONMENT` variable

### `database.py` - Database Connection
**Why:** SQLAlchemy setup for MySQL database  
**How:** Creates engine with connection pooling, provides `get_db()` generator for FastAPI dependency injection  
**Unique:** Connection recycling (1hr), pool pre-ping for reliability

### `main.py` - FastAPI App
**Why:** API entry point  
**How:** FastAPI setup with CORS middleware, includes search router  
**Unique:** CORS configured for React frontend (localhost:3000)

### `requirements.txt` - Dependencies
**Why:** Python package management  
**Includes:** FastAPI, SQLAlchemy, PyMySQL, python-dotenv, Pydantic

### `.gitignore` - Git Exclusions
**Why:** Keep secrets and build artifacts out of repo  
**Covers:** `.env`, Python cache, venv, IDE files

## Search Module (`search/`)

### `search/config.py` & `search/database.py`
**Why:** Self-contained search module with own config/DB setup  
**How:** Duplicate of root config/database but scoped to search module

### `search/routers/router.py` - Search Endpoint
**Why:** REST API endpoint for tutor search  
**How:** FastAPI router at `/search/tutors` with query params (q, tutor_name, department, course_number, limit, offset)  
**Unique:** Validates query params (max length, range), converts department to uppercase, strips whitespace

### `search/services/service.py` - Search Logic
**Why:** Business logic for tutor search  
**How:** Complex SQLAlchemy query with joins, filters by name/course, orders by rating/sessions/rate  
**Unique:** Multi-field search (name + course), pagination, returns only approved tutors, handles nulls in ordering

### `search/schemas/models.py` - API Response Models
**Why:** Pydantic models for type-safe API responses  
**How:** Defines `TutorSearchResult`, `TutorSearchResponse`, `CourseInfo`  
**Unique:** Pagination metadata (total, limit, offset) included in response

## Models (`search/models/`)

### `user.py` & `tutor_profile.py`
**Why:** Core user/tutor entities (duplicated in search module)  
**Same as root models** - User with SFSU email, TutorProfile with languages/rate/status

### `course.py` - Course Model
**Why:** Courses that tutors can teach  
**How:** Stores department_code, course_number, title, is_active flag  
**Unique:** Composite index on (department_code, course_number, title) for fast search

### `tutor_course.py` - Junction Table
**Why:** Many-to-many relationship between tutors and courses  
**How:** Simple junction table with tutor_id + course_id composite primary key  
**Unique:** Composite index for efficient filtering

### `availability_slot.py` - Availability Model
**Why:** Tutor availability slots (optional, not used in initial search)  
**How:** Stores weekday (0-6), start/end time, location mode  
**Note:** Created but not yet integrated into search

### `tutor_metric.py` - Performance Metrics
**Why:** Tutor ratings and session counts for ranking  
**How:** Stores avg_rating, sessions_completed, total_reviews  
**Unique:** Used in search ordering (rating desc, sessions desc)

### `models/__init__.py` - Model Exports
**Why:** Centralized imports for all models  
**Exports:** All 6 models (User, TutorProfile, Course, TutorCourse, AvailabilitySlot, TutorMetric)
