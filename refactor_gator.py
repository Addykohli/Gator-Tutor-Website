import os

# Target the 'application' directory
TARGET_DIR = os.path.join(os.getcwd(), "application")

EXCLUDED_DIRS = ["__pycache__", ".git", "node_modules", "build", "coverage", "venv", ".venv", ".ds_store"]
EXCLUDED_FILES = ["package-lock.json", "yarn.lock", "migrate_emails.py", "refactor_gator.py"] 
# Excluding migrate_emails.py because I will manually inspect it or let it be (it was creating migration logic specific to sfsu/gmail)
# Actually, migrate_emails.py has explicit "sfsu.edu" strings for logic. If I change them, it might break the logic of "finding sfsu emails".
# But the user said "refactor instances of sfsu".
# If I change "query(... like %sfsu.edu%)" to "query(... like %gmail.com%)", the migration script becomes "migrate gmail to gmail".
# So migrate_emails.py logic IS about the transition. Changing it blindly potentially invalidates it as a migration script.
# I'll exclude it safely.

def refactor_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        new_content = content
        
        # 1. Variables/Properties: sfsu_email -> email
        # This covers my_user.sfsu_email -> my_user.email
        # And user["sfsu_email"] -> user["email"]
        new_content = new_content.replace("sfsu_email", "email")
        
        # 2. Email Domain requirements: @sfsu.edu -> @gmail.com
        new_content = new_content.replace("@sfsu.edu", "@gmail.com")
        
        # 3. Institution Name: SFSU -> Gator
        new_content = new_content.replace("SFSU", "Gator")
        
        # 4. Institution Name Lower: sfsu -> gator
        # This handles residual "sfsu" that wasn't part of "sfsu_email" or "@sfsu.edu"
        # e.g. "validate_sfsu_id" -> "validate_gator_id"
        new_content = new_content.replace("sfsu", "gator")

        if new_content != content:
            print(f"Updating {filepath}")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
    except Exception as e:
        print(f"Error reading/writing {filepath}: {e}")

def main():
    print(f"Scanning {TARGET_DIR}...")
    for root, dirs, files in os.walk(TARGET_DIR):
        # Filter dirs
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            if file in EXCLUDED_FILES or file.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.pyc', '.tar.gz', '.pkl')):
                continue
            
            filepath = os.path.join(root, file)
            
            # CRITICAL: Skip search/models/user.py to avoid breaking DB mapping "sfsu_email"
            if "search" in root and "models" in root and file == "user.py":
                # Special handling for user.py docs if wanted, or just skip
                # I'll skip code modifications in it.
                continue
            
            # Normalize path check just in case
            if "user.py" in file and "models" in root: # Loose check safety
                 continue

            refactor_file(filepath)

if __name__ == "__main__":
    main()
