from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_key: str = ""
    ilmu_api_key: str = ""
    ilmu_anthropic_base_url: str = "https://api.ilmu.ai/anthropic"
    ilmu_model: str = "nemo-super"
    ilmu_vision_model: str = "claude-sonnet-4-6"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    deepseek_api_key: str = ""
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-key-change-in-production"
    environment: str = "development"
    allowed_origins: str = '["http://localhost:3000"]'
    demo_user_id: str = "00000000-0000-0000-0000-000000000001"
    bedrock_aws_region: str = "us-west-2"
    bedrock_agent_name: str = "bajet-buddy"
    bedrock_guardrail_id: str = ""
    cognito_client_id: str = ""
    cognito_discovery_url: str = ""
    agentcore_runtime_arn: str = ""
    agentcore_bearer_token: str = ""
    sentry_dsn: str = ""
    kpdn_pricecatcher_enabled: bool = False
    sentinel_news_feeds: str = "https://www.freemalaysiatoday.com/feed/"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
