import sys
import os

# Add current dir to path to allow imports
sys.path.append(os.getcwd())

from search.database import engine, SessionLocal
from search.models.course import Course

# Course Data
courses_data = [
    # MATH
    {"dept": "MATH", "num": "100", "title": "Algebra Workshop"},
    {"dept": "MATH", "num": "199", "title": "Pre-Calculus"},
    {"dept": "MATH", "num": "226", "title": "Calculus I"},
    {"dept": "MATH", "num": "227", "title": "Calculus II"},
    {"dept": "MATH", "num": "325", "title": "Linear Algebra"},
    {"dept": "MATH", "num": "338", "title": "Statistics Applied to Natural Sciences"},
    {"dept": "MATH", "num": "370", "title": "Real Analysis I"},
    {"dept": "MATH", "num": "400", "title": "History of Mathematics"},

    # PHYSICS (PHY)
    {"dept": "PHYS", "num": "111", "title": "General Physics I"},
    {"dept": "PHYS", "num": "121", "title": "General Physics II"},
    {"dept": "PHYS", "num": "220", "title": "General Physics with Calculus I"},
    {"dept": "PHYS", "num": "240", "title": "General Physics with Calculus III"},
    {"dept": "PHYS", "num": "300", "title": "Modern Physics"},
    {"dept": "PHYS", "num": "430", "title": "Quantum Mechanics I"},

    # BIOLOGY (BIO)
    {"dept": "BIOL", "num": "100", "title": "Human Biology"},
    {"dept": "BIOL", "num": "230", "title": "Introductory Biology I"},
    {"dept": "BIOL", "num": "240", "title": "Introductory Biology II"},
    {"dept": "BIOL", "num": "350", "title": "Cell Biology"},
    {"dept": "BIOL", "num": "355", "title": "Genetics"},
    {"dept": "BIOL", "num": "612", "title": "Human Physiology"},

    # PHILOSOPHY (PHIL)
    {"dept": "PHIL", "num": "110", "title": "Introduction to Critical Thinking I"},
    {"dept": "PHIL", "num": "320", "title": "Ethics"},
    {"dept": "PHIL", "num": "450", "title": "Philosophy of Science"},
    {"dept": "PHIL", "num": "620", "title": "Political Philosophy"},

    # HISTORY (HIST)
    {"dept": "HIST", "num": "114", "title": "World History to 1500"},
    {"dept": "HIST", "num": "115", "title": "World History since 1500"},
    {"dept": "HIST", "num": "420", "title": "The American Revolution"},
    {"dept": "HIST", "num": "471", "title": "The United States since 1890"},

    # ECONOMICS (ECON)
    {"dept": "ECON", "num": "101", "title": "Introduction to Microeconomic Analysis"},
    {"dept": "ECON", "num": "102", "title": "Introduction to Macroeconomic Analysis"},
    {"dept": "ECON", "num": "301", "title": "Intermediate Microeconomic Theory"},
    {"dept": "ECON", "num": "302", "title": "Intermediate Macroeconomic Theory"},
    {"dept": "ECON", "num": "312", "title": "Introduction to Econometrics"},

    # CHEMISTRY (CHEM)
    {"dept": "CHEM", "num": "115", "title": "General Chemistry I"},
    {"dept": "CHEM", "num": "215", "title": "General Chemistry II"},
    {"dept": "CHEM", "num": "233", "title": "Organic Chemistry I"},
    {"dept": "CHEM", "num": "335", "title": "Organic Chemistry II"},

    # COMPUTER SCIENCE (CSC) - Adding as typically expected
    {"dept": "CSC", "num": "220", "title": "Data Structures"},
    {"dept": "CSC", "num": "340", "title": "Programming Methodology"},
    {"dept": "CSC", "num": "413", "title": "Software Development"},
    {"dept": "CSC", "num": "510", "title": "Analysis of Algorithms I"},
    {"dept": "CSC", "num": "600", "title": "Programming Languages"},
    {"dept": "CSC", "num": "648", "title": "Software Engineering"},
]

def seed_courses():
    db = SessionLocal()
    count = 0
    try:
        print("Starting course seeding...")
        for data in courses_data:
            exists = db.query(Course).filter_by(
                department_code=data["dept"], 
                course_number=data["num"]
            ).first()

            if not exists:
                course = Course(
                    department_code=data["dept"],
                    course_number=data["num"],
                    title=data["title"],
                    is_active=True
                )
                db.add(course)
                print(f"Adding: {data['dept']} {data['num']} - {data['title']}")
                count += 1
            else:
                print(f"Skipping (Exists): {data['dept']} {data['num']}")
        
        db.commit()
        print(f"\nSUCCESS: Added {count} new courses.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_courses()
