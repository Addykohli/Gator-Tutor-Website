import sys
import os

# Add current dir to path to allow imports
sys.path.append(os.getcwd())

from search.database import SessionLocal
from search.models.course import Course

def update_courses():
    db = SessionLocal()
    try:
        # 1. Remove MATH 199
        math199 = db.query(Course).filter_by(department_code="MATH", course_number="199").first()
        if math199:
            print(f"Removing {math199.department_code} {math199.course_number} - {math199.title}")
            db.delete(math199)
        else:
            print("MATH 199 not found.")

        # 2. Add POLSC courses
        polsc_courses = [
            {"num": "100", "title": "Introduction to Political Science"},
            {"num": "115", "title": "US Politics"},
            {"num": "200", "title": "Introduction to Comparative Politics"},
            {"num": "275", "title": "Political Theory"},
            {"num": "320", "title": "International Relations"},
            {"num": "415", "title": "American Political Development"},
            {"num": "450", "title": "Political Economy"},
            {"num": "500", "title": "Labor and Politics"},
            {"num": "512", "title": "Urban Politics and Policy"}
        ]

        count = 0
        for c in polsc_courses:
            exists = db.query(Course).filter_by(department_code="PLSI", course_number=c["num"]).first()
            if not exists:
                new_course = Course(
                    department_code="PLSI", # Using PLSI as Gator standard code for Political Science
                    course_number=c["num"],
                    title=c["title"],
                    is_active=True
                )
                db.add(new_course)
                print(f"Adding: PLSI {c['num']} - {c['title']}")
                count += 1
            else:
                print(f"Skipping (Exists): PLSI {c['num']}")
        
        db.commit()
        print(f"\nSUCCESS: Removed MATH 199 and added {count} PLSI courses.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_courses()
