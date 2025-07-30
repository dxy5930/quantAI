#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import time
from datetime import datetime
from loguru import logger
from config import Config
from database import db_manager
from complete_data_crawler import CompleteDataCrawler

class AutoBatchCrawler:
    def __init__(self):
        self.crawler = CompleteDataCrawler()
        self.batch_size = 50
        self.delay_between_batches = 60  # 批次间延迟60秒
    
    def run_auto_crawl(self):
        """自动批量爬取所有缺失数据"""
        logger.info("开始自动批量数据爬取...")
        
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        try:
            # 获取总股票数
            total_stocks = db_manager.execute_query("SELECT COUNT(*) FROM stock_info WHERE isActive = 1")
            total_count = total_stocks[0][0] if total_stocks else 0
            
            logger.info(f"总共需要处理 {total_count} 只股票")
            
            # 计算需要的批次数
            total_batches = (total_count + self.batch_size - 1) // self.batch_size
            logger.info(f"将分 {total_batches} 个批次处理，每批 {self.batch_size} 只股票")
            
            total_stats = {
                'f10_success': 0, 'f10_failed': 0,
                'financial_success': 0, 'financial_failed': 0,
                'dividend_success': 0, 'dividend_failed': 0
            }
            
            start_time = datetime.now()
            
            # 逐批处理
            for batch_num in range(total_batches):
                start_index = batch_num * self.batch_size
                
                logger.info(f"=== 开始第 {batch_num + 1}/{total_batches} 批次 ===")
                logger.info(f"处理股票索引: {start_index} - {start_index + self.batch_size - 1}")
                
                batch_start_time = datetime.now()
                
                try:
                    # 执行批次爬取
                    batch_stats = self.crawler.crawl_all_missing_data(
                        start_index=start_index,
                        batch_size=self.batch_size
                    )
                    
                    if batch_stats:
                        # 累计统计
                        for key in total_stats:
                            total_stats[key] += batch_stats[key]
                        
                        batch_duration = (datetime.now() - batch_start_time).total_seconds()
                        logger.info(f"第 {batch_num + 1} 批次完成，耗时 {batch_duration:.1f}秒")
                        logger.info(f"本批次: F10({batch_stats['f10_success']}), 财务({batch_stats['financial_success']}), 分红({batch_stats['dividend_success']})")
                        
                        # 显示总体进度
                        progress = ((batch_num + 1) / total_batches) * 100
                        logger.info(f"总体进度: {progress:.1f}% ({batch_num + 1}/{total_batches})")
                        
                    else:
                        logger.error(f"第 {batch_num + 1} 批次执行失败")
                
                except Exception as e:
                    logger.error(f"第 {batch_num + 1} 批次执行异常: {e}")
                
                # 批次间延迟（最后一批不需要延迟）
                if batch_num < total_batches - 1:
                    logger.info(f"批次间休息 {self.delay_between_batches} 秒...")
                    time.sleep(self.delay_between_batches)
            
            # 总结
            total_duration = (datetime.now() - start_time).total_seconds()
            logger.info("=== 自动批量爬取完成 ===")
            logger.info(f"总耗时: {total_duration:.1f}秒 ({total_duration/60:.1f}分钟)")
            logger.info(f"总计: F10成功{total_stats['f10_success']}只, 财务成功{total_stats['financial_success']}只, 分红成功{total_stats['dividend_success']}只")
            
            # 最终数据统计
            self.show_final_statistics()
            
            return True
            
        except KeyboardInterrupt:
            logger.info("用户中断自动爬取")
            return False
        except Exception as e:
            logger.error(f"自动批量爬取异常: {e}")
            return False
    
    def show_final_statistics(self):
        """显示最终数据统计"""
        logger.info("=== 最终数据统计 ===")
        
        try:
            conn = db_manager.get_connection()
            with conn.cursor() as cursor:
                # 各表总数
                tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    logger.info(f"{table}: {count}条")
                
                # 覆盖率统计
                cursor.execute("SELECT COUNT(*) FROM stock_info WHERE isActive = 1")
                active_stocks = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_f10")
                f10_coverage = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_financial")
                financial_coverage = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_dividend")
                dividend_coverage = cursor.fetchone()[0]
                
                logger.info(f"活跃股票总数: {active_stocks}")
                logger.info(f"F10数据覆盖率: {f10_coverage}/{active_stocks} ({f10_coverage/active_stocks*100:.1f}%)")
                logger.info(f"财务数据覆盖率: {financial_coverage}/{active_stocks} ({financial_coverage/active_stocks*100:.1f}%)")
                logger.info(f"分红数据覆盖率: {dividend_coverage}/{active_stocks} ({dividend_coverage/active_stocks*100:.1f}%)")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"获取最终统计失败: {e}")
    
    def run_missing_data_only(self):
        """只爬取缺失数据的股票"""
        logger.info("开始爬取缺失数据...")
        
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        try:
            # 获取缺失F10数据的股票
            missing_f10 = db_manager.execute_query("""
                SELECT s.symbol, s.name 
                FROM stock_info s 
                LEFT JOIN stock_f10 f ON s.symbol = f.symbol 
                WHERE s.isActive = 1 AND f.symbol IS NULL
                ORDER BY s.symbol
            """)
            
            # 获取缺失财务数据的股票
            missing_financial = db_manager.execute_query("""
                SELECT s.symbol, s.name 
                FROM stock_info s 
                LEFT JOIN stock_financial f ON s.symbol = f.symbol 
                WHERE s.isActive = 1 AND f.symbol IS NULL
                ORDER BY s.symbol
            """)
            
            # 获取缺失分红数据的股票
            missing_dividend = db_manager.execute_query("""
                SELECT s.symbol, s.name 
                FROM stock_info s 
                LEFT JOIN stock_dividend d ON s.symbol = d.symbol 
                WHERE s.isActive = 1 AND d.symbol IS NULL
                ORDER BY s.symbol
            """)
            
            logger.info(f"缺失F10数据: {len(missing_f10) if missing_f10 else 0}只")
            logger.info(f"缺失财务数据: {len(missing_financial) if missing_financial else 0}只")
            logger.info(f"缺失分红数据: {len(missing_dividend) if missing_dividend else 0}只")
            
            # 合并所有缺失数据的股票（去重）
            all_missing = set()
            if missing_f10:
                all_missing.update([(row[0], row[1]) for row in missing_f10])
            if missing_financial:
                all_missing.update([(row[0], row[1]) for row in missing_financial])
            if missing_dividend:
                all_missing.update([(row[0], row[1]) for row in missing_dividend])
            
            missing_stocks = list(all_missing)
            missing_stocks.sort()  # 按股票代码排序
            
            logger.info(f"总共需要处理 {len(missing_stocks)} 只有缺失数据的股票")
            
            if not missing_stocks:
                logger.info("没有发现缺失数据，任务完成")
                return True
            
            # 分批处理缺失数据
            batch_size = 30  # 缺失数据处理用较小批次
            total_batches = (len(missing_stocks) + batch_size - 1) // batch_size
            
            stats = {
                'f10_success': 0, 'f10_failed': 0,
                'financial_success': 0, 'financial_failed': 0,
                'dividend_success': 0, 'dividend_failed': 0
            }
            
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, len(missing_stocks))
                batch_stocks = missing_stocks[start_idx:end_idx]
                
                logger.info(f"=== 处理第 {batch_num + 1}/{total_batches} 批缺失数据 ===")
                
                for i, (symbol, name) in enumerate(batch_stocks):
                    logger.info(f"处理 {symbol} {name} ({start_idx + i + 1}/{len(missing_stocks)})")
                    
                    # 检查并爬取F10数据
                    if not self.crawler._has_f10_data(symbol):
                        if self.crawler._crawl_single_f10(symbol, name):
                            stats['f10_success'] += 1
                        else:
                            stats['f10_failed'] += 1
                        time.sleep(1)
                    
                    # 检查并爬取财务数据
                    if not self.crawler._has_financial_data(symbol):
                        if self.crawler._crawl_single_financial(symbol, name):
                            stats['financial_success'] += 1
                        else:
                            stats['financial_failed'] += 1
                        time.sleep(2)
                    
                    # 检查并爬取分红数据
                    if not self.crawler._has_dividend_data(symbol):
                        if self.crawler._crawl_single_dividend(symbol, name):
                            stats['dividend_success'] += 1
                        else:
                            stats['dividend_failed'] += 1
                        time.sleep(1)
                
                # 批次间休息
                if batch_num < total_batches - 1:
                    logger.info("批次间休息30秒...")
                    time.sleep(30)
            
            logger.info("=== 缺失数据爬取完成 ===")
            logger.info(f"F10: 成功{stats['f10_success']}只, 失败{stats['f10_failed']}只")
            logger.info(f"财务: 成功{stats['financial_success']}只, 失败{stats['financial_failed']}只")
            logger.info(f"分红: 成功{stats['dividend_success']}只, 失败{stats['dividend_failed']}只")
            
            self.show_final_statistics()
            return True
            
        except Exception as e:
            logger.error(f"缺失数据爬取异常: {e}")
            return False

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='自动批量股票数据爬虫')
    parser.add_argument('--mode', choices=['all', 'missing'], default='missing',
                       help='爬取模式: all=全量爬取, missing=只爬取缺失数据')
    parser.add_argument('--batch-size', type=int, default=50, help='批次大小')
    parser.add_argument('--delay', type=int, default=60, help='批次间延迟(秒)')
    
    args = parser.parse_args()
    
    # 设置日志
    logger.remove()
    logger.add(
        sys.stdout,
        level=Config.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    logger.add(
        Config.LOG_FILE.replace('.log', '_auto.log'),
        level=Config.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )
    
    logger.info("自动批量爬虫启动...")
    logger.info(f"模式: {args.mode}")
    logger.info(f"批次大小: {args.batch_size}")
    logger.info(f"批次间延迟: {args.delay}秒")
    
    auto_crawler = AutoBatchCrawler()
    auto_crawler.batch_size = args.batch_size
    auto_crawler.delay_between_batches = args.delay
    
    try:
        if args.mode == 'all':
            success = auto_crawler.run_auto_crawl()
        else:  # missing
            success = auto_crawler.run_missing_data_only()
        
        if success:
            logger.info("自动批量爬取任务完成")
            return 0
        else:
            logger.error("自动批量爬取任务失败")
            return 1
            
    except KeyboardInterrupt:
        logger.info("用户中断程序")
        return 1
    except Exception as e:
        logger.error(f"程序执行异常: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())