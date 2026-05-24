"""One-shot deployment script for the BajetBuddy AgentCore runtime.

Usage:
    cd apps/api
    python deploy_agentcore.py

Prerequisites:
    - AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION)
    - Bedrock model access enabled for us.anthropic.claude-haiku-4-5-20251001 in us-west-2
    - pip install bedrock-agentcore bedrock-agentcore-starter-toolkit strands-agents boto3

The script will:
    1. Auto-create an ECR repository
    2. Auto-create an IAM execution role with Bedrock permissions
    3. Build and push a Docker image containing the app
    4. Deploy to Bedrock AgentCore Runtime and return the runtime ARN

Set AGENTCORE_RUNTIME_ARN and AGENTCORE_BEARER_TOKEN in your .env to enable
the /api/agentcore/chat proxy route in the FastAPI app.
"""
from __future__ import annotations

import os
import sys

from app.core.config import get_settings


def main() -> None:
    try:
        from bedrock_agentcore_starter_toolkit import Runtime  # type: ignore[import-untyped]
    except ImportError:
        print("ERROR: bedrock-agentcore-starter-toolkit is not installed.")
        print("Run: pip install bedrock-agentcore-starter-toolkit")
        sys.exit(1)

    settings = get_settings()
    region = settings.bedrock_aws_region
    agent_name = settings.bedrock_agent_name

    auth_config: dict = {}
    if settings.cognito_client_id and settings.cognito_discovery_url:
        auth_config = {
            "customJWTAuthorizer": {
                "allowedClients": [settings.cognito_client_id],
                "discoveryUrl": settings.cognito_discovery_url,
            }
        }

    runtime = Runtime()
    print(f"Configuring AgentCore runtime '{agent_name}' in {region}...")
    runtime.configure(
        entrypoint="app/agents/agentcore_app.py",
        auto_create_execution_role=True,
        auto_create_ecr=True,
        requirements_file="requirements.txt",
        region=region,
        agent_name=agent_name,
        **({"authorizer_configuration": auth_config} if auth_config else {}),
    )

    print("Launching deployment (this may take a few minutes)...")
    launch_result = runtime.launch(
        env_vars={"OTEL_PYTHON_EXCLUDED_URLS": "/ping,/invocations"},
    )

    print("\n✅ Deployment complete!")
    print(f"Runtime ARN: {launch_result.get('agentRuntimeArn', 'see AWS console')}")
    print("\nAdd these to your .env:")
    print(f"  AGENTCORE_RUNTIME_ARN={launch_result.get('agentRuntimeArn', '<arn>')}")
    print("  AGENTCORE_BEARER_TOKEN=<cognito-jwt-or-api-token>")


if __name__ == "__main__":
    main()
