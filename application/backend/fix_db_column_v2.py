import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Explicit connection string to bypass environment issues
DATABASE_URL = "mysql+pymysql://team08:CSC648Team08Password!@127.0.0.1:3306/team08_db"

def fix():
    print(f"Connecting to {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    try:
        insp = inspect(engine)
        columns = [c['name'] for c in insp.get_columns('users')]
        print(f"Current columns: {columns}")
        
        if 'email' in columns:
            print("'email' column already exists. No action needed.")
        elif 'sfsu_email' in columns:
            print("'sfsu_email' found. Renaming to 'email'...")
            try:
                # Use connection for DDL
                with engine.connect() as conn:
                    # In newer SQLAlchemy/Drivers, commit might be needed for DDL if not autocommit
                    conn.execute(text("ALTER TABLE users RENAME COLUMN sfsu_email TO email;"))
                    conn.commit()
                print("SUCCESS: Renamed to email.")
            except Exception as e:
                print(f"RENAME failed: {e}")
                print("Trying CHANGE syntax...")
                try:
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE users CHANGE sfsu_email email VARCHAR(255) NOT NULL;"))
                        conn.commit()
                    print("SUCCESS: Changed to email.")
                except Exception as e2:
                    print(f"CHANGE failed: {e2}")
        else:
            print("Neither 'sfsu_email' nor 'email' found. Check table definition.")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    fix()
