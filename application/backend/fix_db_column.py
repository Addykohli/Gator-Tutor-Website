import sys
import os
sys.path.append(os.getcwd())
from search.database import SessionLocal, engine
from sqlalchemy import text, inspect

def fix():
    try:
        insp = inspect(engine)
        columns = [c['name'] for c in insp.get_columns('users')]
        print(f"Current columns: {columns}")
        
        if 'email' in columns:
            print("'email' column already exists. No action needed.")
        elif 'sfsu_email' in columns:
            print("'sfsu_email' found. Renaming to 'email'...")
            db = SessionLocal()
            try:
                 db.execute(text("ALTER TABLE users RENAME COLUMN sfsu_email TO email;"))
                 db.commit()
                 print("SUCCESS: Renamed to email.")
            except Exception as e:
                 print(f"Error renaming: {e}")
                 db.rollback()
                 # try CHANGE
                 try:
                     db.execute(text("ALTER TABLE users CHANGE sfsu_email email VARCHAR(255) NOT NULL;"))
                     db.commit()
                     print("SUCCESS: Changed to email.")
                 except Exception as e2:
                     print(f"Error changing: {e2}")
                     db.rollback()
            finally:
                db.close()
        else:
            print("Neither 'sfsu_email' nor 'email' found. Check table!")
    except Exception as e:
        print(f"Schema inspection failed: {e}")

if __name__ == "__main__":
    fix()
