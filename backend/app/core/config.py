from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Путь к корневой папке проекта (на уровень выше backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    """
    Настройки приложения, загружаемые из .env файла
    """
    
    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "astroai_user"
    POSTGRES_PASSWORD: str = "astroai_password_dev"
    POSTGRES_DB: str = "astroai_db"
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # DeepSeek API
    DEEPSEEK_API_KEY: str = "your_deepseek_api_key_here"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your_secret_key_here_change_in_production"
    
    # Pydantic v2 настройки для загрузки из .env
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Свойство для создания Database URL
    @property
    def DATABASE_URL(self) -> str:
        """Строка подключения к PostgreSQL для SQLAlchemy"""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Свойство для Redis URL
    @property
    def REDIS_URL(self) -> str:
        """Строка подключения к Redis"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


# Создаём глобальный экземпляр настроек
settings = Settings()
