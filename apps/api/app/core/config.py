from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    ilmu_api_key: str = ""
    ilmu_anthropic_base_url: str = "https://api.ilmu.ai/anthropic"
    ilmu_model: str = "nemo-super"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    deepseek_api_key: str = ""
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-key-change-in-production"
    environment: str = "development"
    allowed_origins: str = '["http://localhost:3000"]'

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
