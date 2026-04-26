from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="UCAR_", env_file=".env", extra="ignore")

    env: str = "dev"
    db_url: str = "sqlite:///../ucar.db"

    jwt_secret: str = "change-me"
    jwt_issuer: str = "ucar-insight"
    jwt_audience: str = "ucar-insight-frontend"
    cors_origins: str = "http://localhost:4173,http://127.0.0.1:4173"
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"

    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
