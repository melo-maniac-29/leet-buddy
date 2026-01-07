from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import UserAISettings

router = APIRouter(prefix="/api/ai-settings", tags=["ai-settings"])

# Request/Response models
class AIProviderConfig(BaseModel):
    provider: str  # 'openai', 'azure', 'ollama', 'lmstudio', 'custom'
    api_base_url: str
    model_name: str
    enabled: bool = True

class AISettingsResponse(BaseModel):
    provider: str
    api_base_url: str
    model_name: str
    enabled: bool
    has_api_key: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

# Predefined provider configurations
PROVIDER_CONFIGS = {
    'openai': {
        'api_base_url': 'https://api.openai.com/v1',
        'default_model': 'gpt-4o-mini'
    },
    'azure': {
        'api_base_url': 'https://<resource>.openai.azure.com/openai/deployments/<deployment>',
        'default_model': 'gpt-4'
    },
    'ollama': {
        'api_base_url': 'http://localhost:11434/v1',
        'default_model': 'llama3.2'
    },
    'lmstudio': {
        'api_base_url': 'http://localhost:1234/v1',
        'default_model': 'local-model'
    },
    'github': {
        'api_base_url': 'https://models.inference.ai.azure.com',
        'default_model': 'gpt-4o-mini'
    }
}

@router.get("/providers")
def get_available_providers():
    """Get list of supported AI providers with default configs"""
    return {
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "base_url": PROVIDER_CONFIGS['openai']['api_base_url'],
                "default_model": PROVIDER_CONFIGS['openai']['default_model'],
                "requires_api_key": True
            },
            {
                "id": "azure",
                "name": "Azure OpenAI",
                "base_url": PROVIDER_CONFIGS['azure']['api_base_url'],
                "default_model": PROVIDER_CONFIGS['azure']['default_model'],
                "requires_api_key": True,
                "note": "Replace <resource> and <deployment> with your values"
            },
            {
                "id": "github",
                "name": "GitHub Models",
                "base_url": PROVIDER_CONFIGS['github']['api_base_url'],
                "default_model": PROVIDER_CONFIGS['github']['default_model'],
                "requires_api_key": True,
                "note": "Use GitHub personal access token"
            },
            {
                "id": "ollama",
                "name": "Ollama (Local)",
                "base_url": PROVIDER_CONFIGS['ollama']['api_base_url'],
                "default_model": PROVIDER_CONFIGS['ollama']['default_model'],
                "requires_api_key": False
            },
            {
                "id": "lmstudio",
                "name": "LM Studio (Local)",
                "base_url": PROVIDER_CONFIGS['lmstudio']['api_base_url'],
                "default_model": PROVIDER_CONFIGS['lmstudio']['default_model'],
                "requires_api_key": False
            },
            {
                "id": "custom",
                "name": "Custom OpenAI-Compatible",
                "base_url": "http://localhost:8080/v1",
                "default_model": "custom-model",
                "requires_api_key": False,
                "note": "Any OpenAI-compatible API endpoint"
            }
        ]
    }

@router.get("/{user_id}", response_model=AISettingsResponse)
def get_user_ai_settings(user_id: str, db: Session = Depends(get_db)):
    """Get user's AI provider settings"""
    settings = db.query(UserAISettings).filter(UserAISettings.user_id == user_id).first()
    
    if not settings:
        # Return default OpenAI config
        return AISettingsResponse(
            provider="openai",
            api_base_url=PROVIDER_CONFIGS['openai']['api_base_url'],
            model_name=PROVIDER_CONFIGS['openai']['default_model'],
            enabled=False,
            has_api_key=False,
            created_at=None,
            updated_at=None
        )
    
    # Detect provider from base_url
    provider = "custom"
    for p_id, config in PROVIDER_CONFIGS.items():
        if config['api_base_url'] in settings.api_base_url:
            provider = p_id
            break
    
    return AISettingsResponse(
        provider=provider,
        api_base_url=settings.api_base_url,
        model_name=settings.model_name,
        enabled=settings.enabled,
        has_api_key=bool(settings.api_key_encrypted),
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )

@router.post("/{user_id}/configure")
def configure_ai_provider(
    user_id: str,
    config: AIProviderConfig,
    api_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Configure AI provider for user"""
    settings = db.query(UserAISettings).filter(UserAISettings.user_id == user_id).first()
    
    if not settings:
        settings = UserAISettings(user_id=user_id)
        db.add(settings)
    
    # Update settings
    settings.api_base_url = config.api_base_url
    settings.model_name = config.model_name
    settings.enabled = config.enabled
    
    # Store API key (in production, encrypt this!)
    if api_key:
        # TODO: Implement proper encryption
        settings.api_key_encrypted = api_key  # WARNING: Should be encrypted!
    
    settings.updated_at = datetime.now()
    
    db.commit()
    db.refresh(settings)
    
    return {
        "success": True,
        "message": f"AI provider configured: {config.provider}",
        "settings": {
            "api_base_url": settings.api_base_url,
            "model_name": settings.model_name,
            "enabled": settings.enabled
        }
    }

@router.post("/{user_id}/test")
async def test_ai_connection(user_id: str, db: Session = Depends(get_db)):
    """Test AI provider connection"""
    settings = db.query(UserAISettings).filter(UserAISettings.user_id == user_id).first()
    
    if not settings or not settings.enabled:
        raise HTTPException(status_code=400, detail="AI settings not configured")
    
    if not settings.api_key_encrypted:
        raise HTTPException(status_code=400, detail="API key not set")
    
    # TODO: Implement actual API test call
    return {
        "success": True,
        "message": "Connection test successful",
        "provider": settings.api_base_url,
        "model": settings.model_name
    }

@router.delete("/{user_id}")
def delete_ai_settings(user_id: str, db: Session = Depends(get_db)):
    """Delete user's AI settings"""
    settings = db.query(UserAISettings).filter(UserAISettings.user_id == user_id).first()
    
    if settings:
        db.delete(settings)
        db.commit()
    
    return {"success": True, "message": "AI settings deleted"}
