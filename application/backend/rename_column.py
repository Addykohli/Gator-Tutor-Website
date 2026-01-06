import sys
import os

# Add current dir to path
sys.path.append(os.getcwd())

from search.database import SessionLocal
from sqlalchemy import text

def rename_column():
    db = SessionLocal()
    try:
        print("Renaming 'sfsu_email' column to 'email' in 'users' table...")
        
        # Try MySQL 8.0+ syntax
        try:
            sql = text("ALTER TABLE users RENAME COLUMN sfsu_email TO email;")
            db.execute(sql)
            db.commit()
            print("SUCCESS: Column renamed using RENAME COLUMN.")
            return
        except Exception as e:
            print(f"RENAME COLUMN failed, trying CHANGE: {e}")
            db.rollback()

        # Fallback for older MySQL
        # Note: We must replicate the column definition.
        # Original: String(255), nullable=False.
        sql = text("ALTER TABLE users CHANGE sfsu_email email VARCHAR(255) NOT NULL;")
        db.execute(sql)
        db.commit()
        print("SUCCESS: Column renamed using CHANGE.")
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    rename_column()
