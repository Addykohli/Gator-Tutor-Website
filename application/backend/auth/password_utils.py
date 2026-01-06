import re

def validate_email(email: str) -> bool:
    # UPDATED: Now requires gmail.com per new requirements
    email_regex = r"^[A-Za-z0-9._%+-]+@gmail\.com$"
    return re.match(email_regex, email) is not None

def make_simple_token(user_id: int) -> str:
    return f"token-{user_id}"