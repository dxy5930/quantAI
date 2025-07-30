#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
from datetime import datetime
from loguru import logger
from config import Config
from database import db_manager
from crawler import crawler

def setup_logging():
    """设置日志"""
    # 创建日志目录
    log_dir = os.path.dirname(Config.LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 配置loguru
    logger.remove()  # 移除默认处理器
    
    # 添加控制台输出
    logger.add(
        sys.stdout,
        level=Config.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    
    # 添加文件输出
    logger.add(
        Config.LOG_FILE,
        level=Config.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )

def crawl_all_data():
    """爬取所有数据"""
    logger.info("=" * 50)
    logger.info("开始执行完整股票数据爬取任务")
    logger.info("=" * 50)
    
    start_time = datetime.now()
    
    try:
        # 测试数据库连接
        if not db_manager.test_connection():
            logger.error("数据库连接失败，退出程序")
            return False
        
        # 1. 爬取股票基本信息和当日交易数据
        logger.info("步骤1: 爬取股票基本信息和当日交易数据")
        success, failed = crawler.crawl_all_stocks()
        logger.info(f"股票基本数据爬取完成: 成功{success}只, 失败{failed}只")
        
        # 2. 获取统计信息
        stats = db_manager.get_stock_count()
        logger.info(f"当前数据库统计: {stats}")
        
        # 3. 爬取F10基本信息（限制数量）
        logger.info("步骤2: 爬取F10基本信息")
        f10_success, f10_failed = crawler.crawl_f10_data()
        logger.info(f"F10信息爬取完成: 成功{f10_success}只, 失败{f10_failed}只")
        
        # 4. 爬取财务数据（限制数量）
        logger.info("步骤3: 爬取财务数据")
        fin_success, fin_failed = crawler.crawl_financial_data()
        logger.info(f"财务数据爬取完成: 成功{fin_success}只, 失败{fin_failed}只")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info("=" * 50)
        logger.info("股票数据爬取任务完成")
        logger.info(f"总耗时: {duration:.2f}秒")
        logger.info(f"股票数据: 成功{success}只, 失败{failed}只")
        logger.info(f"F10信息: 成功{f10_success}只, 失败{f10_failed}只")
        logger.info(f"财务数据: 成功{fin_success}只, 失败{fin_failed}只")
        logger.info("=" * 50)
        
        return True
        
    except Exception as e:
        logger.error(f"爬取任务执行失败: {e}")
        return False

def crawl_basic_data():
    """只爬取基本股票数据"""
    logger.info("开始执行基本股票数据爬取")
    
    try:
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        success, failed = crawler.crawl_all_stocks()
        logger.info(f"基本股票数据爬取完成: 成功{success}只, 失败{failed}只")
        
        stats = db_manager.get_stock_count()
        logger.info(f"数据库统计: {stats}")
        
        return True
        
    except Exception as e:
        logger.error(f"基本数据爬取失败: {e}")
        return False

def crawl_historical_data(symbol, days=30):
    """爬取历史数据"""
    logger.info(f"开始爬取股票{symbol}的{days}天历史数据")
    
    try:
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        from datetime import timedelta
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')
        end_date = datetime.now().strftime('%Y%m%d')
        
        success = crawler.crawl_historical_data(symbol, start_date=start_date, end_date=end_date)
        
        if success:
            logger.info(f"股票{symbol}历史数据爬取成功")
        else:
            logger.error(f"股票{symbol}历史数据爬取失败")
        
        return success
        
    except Exception as e:
        logger.error(f"历史数据爬取失败: {e}")
        return False

def test_connection():
    """测试数据库连接"""
    logger.info("测试数据库连接")
    
    if db_manager.test_connection():
        logger.info("数据库连接成功")
        stats = db_manager.get_stock_count()
        logger.info(f"数据库统计: {stats}")
        return True
    else:
        logger.error("数据库连接失败")
        return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='股票数据爬虫')
    parser.add_argument('--mode', choices=['all', 'basic', 'historical', 'test'], 
                       default='all', help='爬取模式')
    parser.add_argument('--symbol', help='股票代码（历史数据模式使用）')
    parser.add_argument('--days', type=int, default=30, help='历史数据天数')
    
    args = parser.parse_args()
    
    # 设置日志
    setup_logging()
    
    logger.info(f"股票爬虫启动，模式: {args.mode}")
    
    try:
        if args.mode == 'all':
            success = crawl_all_data()
        elif args.mode == 'basic':
            success = crawl_basic_data()
        elif args.mode == 'historical':
            if not args.symbol:
                logger.error("历史数据模式需要指定股票代码")
                return 1
            success = crawl_historical_data(args.symbol, args.days)
        elif args.mode == 'test':
            success = test_connection()
        else:
            logger.error(f"未知模式: {args.mode}")
            return 1
        
        if success:
            logger.info("任务执行成功")
            return 0
        else:
            logger.error("任务执行失败")
            return 1
            
    except KeyboardInterrupt:
        logger.info("用户中断程序")
        return 1
    except Exception as e:
        logger.error(f"程序执行异常: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())