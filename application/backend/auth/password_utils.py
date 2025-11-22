import re

def validate_sfsu_email(email: str) -> bool:
    sfsu_email = r"^[A-Za-z0-9._%+-]+@sfsu\.edu$"
    return re.match(sfsu_email, email) is not None

def make_simple_token(user_id: int) -> str:
    return f"token-{user_id}"