from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str = "tesis-neumoai-dev-secret"
    JWT_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env")


# Instanciamos la configuración para usarla en otros archivos
settings = Settings()
