import sys
import os
sys.path.append(os.getcwd())
from search.database import engine
from sqlalchemy import inspect

def check():
    try:
        insp = inspect(engine)
        columns = [c['name'] for c in insp.get_columns('users')]
        print(f"Columns in users: {columns}")
    except Exception as e:
        print(f"Error inspecting schema: {e}")

if __name__ == "__main__":
    check()
