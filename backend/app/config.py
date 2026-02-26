from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    BACKEND_CORS_ORIGINS: str = ""
    SUMMARY_MODE: str = "template"
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "google/gemini-2.0-flash-001"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env"}


settings = Settings()
