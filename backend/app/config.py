from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "job_recruitment"

    # JWT
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Job Recruitment System"

    # Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB

    # AI/ML
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SIMILARITY_THRESHOLD: float = 0.6
    # Local LLM configuration (optional). If USE_LOCAL_LLM is true and LOCAL_LLM_MODEL
    # is set, the server will attempt to use a local HF-compatible text-generation
    # model (e.g. 'gpt2', 'tiiuae/falcon-micro' or any CPU/GPU model you have) as a
    # fallback to Gemini. Note: MiniLM is normally an embedding model (MiniLM-L6)
    # and not a text generation model. Use an appropriate local generator if you
    # want full chat capabilities.
    USE_LOCAL_LLM: bool = False
    LOCAL_LLM_MODEL: str = ""

    # External Job APIs - RapidAPI
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "jsearch.p.rapidapi.com"
    GITHUB_TOKEN: str = ""

    # External Job APIs - Direct
    INDEED_API_KEY: str = ""
    USAJOBS_API_KEY: str = ""
    USAJOBS_USER_EMAIL: str = ""
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    ADZUNA_COUNTRY: str = "us"

    # Optional Services
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    NEWSAPI_KEY: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Payment
    STRIPE_API_KEY: str = ""

    # SMS
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""

    # Job Search Settings
    ENABLED_JOB_SOURCES: str = "github,adzuna"  # Comma-separated: github,indeed,usajobs,adzuna
    EXTERNAL_JOB_LIMIT: int = 100
    INTERNAL_JOB_WEIGHT: float = 1.2  # Boost for internal jobs in ranking

    # Redis Cache (optional)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


settings = Settings()

