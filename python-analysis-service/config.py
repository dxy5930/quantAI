"""
配置管理
"""

import os
from typing import Optional
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    """应用配置"""
    
    # 服务配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # 缓存配置
    CACHE_SIZE: int = int(os.getenv("CACHE_SIZE", "1000"))
    
    # 模型配置
    EMBEDDING_MODEL_TYPE: str = os.getenv("EMBEDDING_MODEL_TYPE", "word2vec")  # word2vec 或 sentence_transformer
    SENTENCE_TRANSFORMER_MODEL: str = os.getenv("SENTENCE_TRANSFORMER_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
    WORD2VEC_MODEL_PATH: str = os.getenv("WORD2VEC_MODEL_PATH", "")  # 预训练Word2Vec模型路径
    
    # OpenAI配置
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "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")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "8000"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))
    
    # 通义千问配置
    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "sk-b5bcc44003be481f825decbfaf1c6085")
    QWEN_MODEL: str = os.getenv("QWEN_MODEL", "qwen-plus")
    QWEN_MAX_TOKENS: int = int(os.getenv("QWEN_MAX_TOKENS", "8000"))
    QWEN_TEMPERATURE: float = float(os.getenv("QWEN_TEMPERATURE", "0.3"))
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/analysis_service.log")
    
    # 数据库配置 - MySQL配置匹配backend
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:restosuite@localhost:3366/chaogu?charset=utf8mb4&collation=utf8mb4_unicode_ci")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3366"))
    DB_USERNAME: str = os.getenv("DB_USERNAME", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "restosuite")
    DB_DATABASE: str = os.getenv("DB_DATABASE", "chaogu")
    
    # Redis配置
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # 股票数据配置
    STOCK_DATA_CACHE_TTL: int = int(os.getenv("STOCK_DATA_CACHE_TTL", "3600"))  # 1小时
    
    # 分析配置
    MAX_KEYWORDS: int = int(os.getenv("MAX_KEYWORDS", "20"))
    MAX_RECOMMENDATIONS: int = int(os.getenv("MAX_RECOMMENDATIONS", "50"))
    
    # API超时配置
    API_REQUEST_TIMEOUT: int = int(os.getenv("API_REQUEST_TIMEOUT", "300"))  # 5分钟
    DATABASE_QUERY_TIMEOUT: int = int(os.getenv("DATABASE_QUERY_TIMEOUT", "120"))  # 2分钟
    
    @classmethod
    def get_log_config(cls) -> dict:
        """获取日志配置"""
        return {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
                "file": {
                    "formatter": "default",
                    "class": "logging.FileHandler",
                    "filename": cls.LOG_FILE,
                },
            },
            "root": {
                "level": cls.LOG_LEVEL,
                "handlers": ["default", "file"],
            },
        }

# 全局配置实例
config = Config()