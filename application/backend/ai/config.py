"""
Configuration for the Gemini AI service.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory (parent of ai/)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)


class AIConfig:
    """Configuration settings for the AI service."""
    
    # OpenRouter API configuration
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Safety settings - only allow SELECT queries
    ALLOWED_SQL_KEYWORDS = ["SELECT"]
    FORBIDDEN_SQL_KEYWORDS = [
        "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", 
        "TRUNCATE", "REPLACE", "GRANT", "REVOKE", "EXECUTE", 
        "EXEC", "CALL", "SET", "SHOW", "DESCRIBE"
    ]
    
    # Maximum results to return from queries
    MAX_QUERY_RESULTS = 100
    
    # Maximum number of function calls in a single conversation
    MAX_FUNCTION_CALLS = 5


ai_config = AIConfig()
