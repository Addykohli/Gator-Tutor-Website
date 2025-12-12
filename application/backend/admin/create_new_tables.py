from search.database import engine, Base
#from admin.models.tutor_course_request import TutorCourseRequest
#from admin.models.tutor_application import TutorApplication
from admin.models.course_request import CourseRequest
print("creating report tables...")


# This creates tables only if they don't already exist
Base.metadata.create_all(bind=engine, checkfirst=True)

print("Report tables ensured successfully")

