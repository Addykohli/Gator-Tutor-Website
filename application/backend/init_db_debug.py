import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from search.database import engine, Base

# Import all models explicitly
print("Importing models...")
try:
    from search.models.user import User
    from search.models.tutor_profile import TutorProfile
    from search.models.course import Course
    from search.models.tutor_course import TutorCourse
    from schedule.models.availability_slot import AvailabilitySlot
    from schedule.models.booking import Booking
    from chat.models.chat_message import ChatMessage
    from chat.models.chat_media import ChatMedia
    from admin.models.course_request import CourseRequest
    from admin.models.reports import Reports
    from admin.models.tutor_application import TutorApplication
    from admin.models.tutor_course_request import TutorCourseRequest
    print("All models imported successfully.")
except ImportError as e:
    print(f"CRITICAL ERROR: importing models failed: {e}")
    sys.exit(1)

def init_db():
    print(f"Tables found in metadata: {Base.metadata.tables.keys()}")
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
