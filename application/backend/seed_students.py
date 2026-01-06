import sys
import os

# Add current dir to path to allow imports
sys.path.append(os.getcwd())

from search.database import SessionLocal
from search.models.user import User
from sqlalchemy.exc import IntegrityError

# Standard password for all seeded users
PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$HoMwZgxB6L13rvX+n1MKYQ$QJ3UYKKWgLcK4kKCKe8LtIPPC9w0PJF7h9vyuY4G5Nc"

students_data = [
    # Asian
    ("Kevin", "Chen"), ("Jessica", "Wong"), ("David", "Kim"), ("Michelle", "Nguyen"),
    ("Ryan", "Lee"), ("Emily", "Zhang"), ("Justin", "Liu"), ("Sarah", "Tran"),
    ("Brandon", "Wu"), ("Tiffany", "Lin"), ("Stephanie", "Park"), ("Jason", "Ho"),
    ("Andrew", "Yang"), ("Grace", "Choi"),
    
    # White
    ("Michael", "Smith"), ("Jennifer", "Johnson"), ("Christopher", "Brown"), ("Sarah", "Davis"),
    ("Matthew", "Miller"), ("Ashley", "Wilson"), ("Joshua", "Moore"), ("Amanda", "Taylor"),
    ("Daniel", "Anderson"), ("Megan", "Thomas"), ("James", "Jackson"), ("Lauren", "White"),
    ("Robert", "Harris"), ("Elizabeth", "Martin"), ("William", "Thompson"),

    # Latino
    ("Jose", "Garcia"), ("Maria", "Rodriguez"), ("Carlos", "Hernandez"), ("Ana", "Martinez"),
    ("Juan", "Lopez"), ("Sofia", "Gonzalez"),

    # Black
    ("Marcus", "Robinson"), ("Jasmine", "Jones"),

    # Other
    ("Alex", "Patel")
]

def seed_students():
    db = SessionLocal()
    count = 0
    try:
        print("Seeding students...")
        for first, last in students_data:
            # Generate Base Email
            base_email = f"{first[0].lower()}{last.lower()}@gmail.com"
            email = base_email
            
            # Simple collision handling (e.g., msmith@gmail.com duplicates)
            # Only checking specific hardcoded collisions for this specific set if any
            # (Michael Smith -> msmith, Matthew Miller -> mmiller... no overlap in this specific list initials/last combos except potentially generic ones)
            # Actually, let's verify in DB directly
            
            # Check if user already exists
            existing = db.query(User).filter_by(email=email).first()
            if existing:
                # If msmith exists, try msmith1, etc.
                counter = 1
                while existing:
                    email = f"{first[0].lower()}{last.lower()}{counter}@gmail.com"
                    existing = db.query(User).filter_by(email=email).first()
                    counter += 1

            new_user = User(
                first_name=first,
                last_name=last,
                email=email,
                role="student",
                password_hash=PASSWORD_HASH,
                is_deleted=False
            )
            db.add(new_user)
            print(f"Adding: {first} {last} ({email})")
            count += 1
        
        db.commit()
        print(f"\nSUCCESS: Added {count} new students.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_students()
