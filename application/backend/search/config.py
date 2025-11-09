"""
Configuration module for loading environment variables and application settings.
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # Database configuration
    # Default uses localhost (127.0.0.1) for server deployment
    # For local development with SSH tunnel, set DATABASE_URL in .env file
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://teammate:CSC648@127.0.0.1:3306/csc648_dev"
    )
    DATABASE_URL_PROD: Optional[str] = os.getenv("DATABASE_URL_PROD")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "dev")
    
    # Cache configuration
    ENABLE_CACHE: bool = os.getenv("ENABLE_CACHE", "false").lower() == "true"
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "60"))
    
    # API configuration
    API_HOST: str = os.getenv("API_HOST", "127.0.0.1")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    @property
    def database_url(self) -> str:
        """Get the appropriate database URL based on environment."""
        if self.ENVIRONMENT == "prod" and self.DATABASE_URL_PROD:
            return self.DATABASE_URL_PROD
        return self.DATABASE_URL


# Global settings instance
settings = Settings()

