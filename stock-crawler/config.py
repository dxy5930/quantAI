import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3366))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'restosuite')
    DB_NAME = os.getenv('DB_NAME', 'chaogu')
    
    # 数据库连接字符串
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    
    # 爬取配置
    CRAWL_DELAY = float(os.getenv('CRAWL_DELAY', 1))
    BATCH_SIZE = int(os.getenv('BATCH_SIZE', 100))
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/crawler.log')
    
    # 市场配置
    MARKETS = {
        'SH': '沪市',  # 上海证券交易所
        'SZ': '深市',  # 深圳证券交易所
        'BJ': '京市',  # 北京证券交易所
    }
    
    # 板块配置
    SECTORS = {
        '主板': ['SH', 'SZ'],
        '科创板': ['SH'],
        '创业板': ['SZ'],
        '中小板': ['SZ'],
        '北交所': ['BJ'],
    }