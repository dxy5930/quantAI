"""
缓存工具
"""

import time
from typing import Any, Optional, Dict
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

class SimpleCache:
    """简单内存缓存"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.max_size = max_size
        self.ttl = ttl
        self.cache: Dict[str, Dict[str, Any]] = {}
    
    def _generate_key(self, *args, **kwargs) -> str:
        """生成缓存键"""
        key_data = {"args": args, "kwargs": kwargs}
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        if key in self.cache:
            item = self.cache[key]
            if time.time() - item['timestamp'] < self.ttl:
                return item['value']
            else:
                # 过期删除
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any) -> None:
        """设置缓存值"""
        # 如果缓存满了，删除最旧的项
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]['timestamp'])
            del self.cache[oldest_key]
        
        self.cache[key] = {
            'value': value,
            'timestamp': time.time()
        }
    
    def clear(self) -> None:
        """清空缓存"""
        self.cache.clear()
    
    def size(self) -> int:
        """获取缓存大小"""
        return len(self.cache)

def cache_result(cache_instance: SimpleCache, ttl: Optional[int] = None):
    """缓存装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{func.__name__}_{cache_instance._generate_key(*args, **kwargs)}"
            
            # 尝试从缓存获取
            cached_result = cache_instance.get(cache_key)
            if cached_result is not None:
                logger.debug(f"缓存命中: {func.__name__}")
                return cached_result
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 存入缓存
            cache_instance.set(cache_key, result)
            logger.debug(f"缓存存储: {func.__name__}")
            
            return result
        return wrapper
    return decorator

# 全局缓存实例
global_cache = SimpleCache()

class AsyncCacheManager:
    """异步缓存管理器"""
    
    def __init__(self, cache_instance: SimpleCache = None):
        self.cache = cache_instance or global_cache
    
    async def get(self, key: str) -> Optional[Any]:
        """异步获取缓存值"""
        return self.cache.get(key)
    
    async def set(self, key: str, value: Any, ttl: int = None) -> None:
        """异步设置缓存值"""
        self.cache.set(key, value)
    
    async def clear(self) -> None:
        """异步清空缓存"""
        self.cache.clear()

# 全局异步缓存管理器实例
cache_manager = AsyncCacheManager()