import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from search.database import engine, Base

# Import all models to ensure they are registered with Base metadata
try:
    from search.models import User, TutorProfile, Course, TutorCourse
    from schedule.models.availability_slot import AvailabilitySlot
    from schedule.models.booking import Booking
    from chat.models.chat_message import ChatMessage
    from chat.models.chat_media import ChatMedia
    from admin.models.course_request import CourseRequest
    from admin.models.reports import Report
    from admin.models.tutor_application import TutorApplication
    from admin.models.tutor_course_request import TutorCourseRequest
    print("All models imported successfully.")
except ImportError as e:
    print(f"Warning: importing models failed: {e}")
    # Continue anyway, maybe some models are already registered or path issues

def init_db():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
