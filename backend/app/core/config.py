import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Tesis Neumonia API"
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:123456789@localhost/tesis_db"
    )

    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "b3e944b02534ce64fbcd7c6a9a7a937a0ef935b6a71556a3ae2fb376a917e335"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


settings = Settings()
