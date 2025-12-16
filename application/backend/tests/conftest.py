"""
Pytest configuration and fixtures for testing.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Import Base from database
from search.database import Base

# Import all models to ensure they're registered with Base
from search.models.user import User
from search.models.tutor_profile import TutorProfile
from search.models.course import Course
from search.models.tutor_course import TutorCourse
from schedule.models.booking import Booking
from schedule.models.availability_slot import AvailabilitySlot
from chat.models.chat_message import ChatMessage
from chat.models.chat_media import ChatMedia
from admin.models.tutor_application import TutorApplication
from admin.models.tutor_course_request import TutorCourseRequest
from admin.models.course_request import CourseRequest
from admin.models.reports import Reports

# Create in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_engine():
    """Create a test database engine with in-memory SQLite."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield engine
    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def test_db(test_engine):
    """Create a test database session."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def test_user(test_db: Session):
    """Create a test user and return it."""
    user = User(
        sfsu_email="test.user@sfsu.edu",
        first_name="Test",
        last_name="User",
        role="student",
        password_hash="test_hash",
        is_deleted=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_user_a(test_db: Session):
    """Create test user A."""
    user = User(
        sfsu_email="user.a@sfsu.edu",
        first_name="User",
        last_name="A",
        role="student",
        password_hash="test_hash",
        is_deleted=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_user_b(test_db: Session):
    """Create test user B."""
    user = User(
        sfsu_email="user.b@sfsu.edu",
        first_name="User",
        last_name="B",
        role="student",
        password_hash="test_hash",
        is_deleted=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_tutor_user(test_db: Session):
    """Create a test tutor user with tutor profile."""
    user = User(
        sfsu_email="tutor.test@sfsu.edu",
        first_name="Tutor",
        last_name="Test",
        role="tutor",
        password_hash="test_hash",
        is_deleted=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    # Create tutor profile
    tutor_profile = TutorProfile(
        tutor_id=user.user_id,
        bio="Test tutor bio",
        hourly_rate_cents=2500,
        status="approved"
    )
    test_db.add(tutor_profile)
    test_db.commit()
    test_db.refresh(tutor_profile)
    
    return user

