import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from search.database import SessionLocal
from search.models.user import User

def migrate_emails():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email.like("%@sfsu.edu")).all()
        print(f"Found {len(users)} users with @sfsu.edu emails.")
        
        count = 0
        for user in users:
            new_email = user.email.replace("@sfsu.edu", "@gmail.com")
            
            # Check for conflict (unlikely unless gmail version already exists)
            conflict = db.query(User).filter_by(email=new_email).first()
            if conflict:
                print(f"SKIPPING: {user.email} -> {new_email} (Target email already exists)")
            else:
                user.email = new_email
                count += 1
        
        db.commit()
        print(f"SUCCESS: Migrated {count} users to @gmail.com.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_emails()
