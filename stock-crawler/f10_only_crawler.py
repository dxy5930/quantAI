#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import akshare as ak
import pandas as pd
import time
from datetime import datetime
from loguru import logger
from config import Config
from database import db_manager
import random
import sys

class F10OnlyCrawler:
    def __init__(self):
        self.delay = Config.CRAWL_DELAY
        self.batch_size = Config.BATCH_SIZE
        self.max_retries = Config.MAX_RETRIES
    
    def crawl_all_f10_data(self, start_index=0, batch_size=50):
        """只爬取F10数据"""
        logger.info("开始F10数据专项爬取...")
        
        try:
            # 获取缺失F10数据的股票
            missing_f10_stocks = db_manager.execute_query("""
                SELECT s.symbol, s.name 
                FROM stock_info s 
                LEFT JOIN stock_f10 f ON s.symbol = f.symbol 
                WHERE s.isActive = 1 AND f.symbol IS NULL
                ORDER BY s.marketCap DESC
            """)
            
            if not missing_f10_stocks:
                logger.info("所有股票都已有F10数据")
                return True
            
            total_missing = len(missing_f10_stocks)
            logger.info(f"发现 {total_missing} 只股票缺失F10数据")
            
            # 分批处理
            end_index = min(start_index + batch_size, total_missing)
            current_batch = missing_f10_stocks[start_index:end_index]
            
            logger.info(f"处理第 {start_index+1}-{end_index} 只股票")
            
            success_count = 0
            failed_count = 0
            
            for i, (symbol, name) in enumerate(current_batch):
                logger.info(f"正在处理 {symbol} {name} ({start_index + i + 1}/{total_missing})")
                
                try:
                    if self._crawl_single_f10(symbol, name):
                        success_count += 1
                        logger.info(f"✓ {symbol} F10数据获取成功")
                    else:
                        failed_count += 1
                        logger.warning(f"✗ {symbol} F10数据获取失败")
                    
                    # 随机延迟，避免被限制
                    delay = self.delay + random.uniform(0.5, 2.0)
                    time.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"处理{symbol}异常: {e}")
                    failed_count += 1
                    time.sleep(self.delay * 2)
            
            logger.info("=== F10数据批次处理完成 ===")
            logger.info(f"成功: {success_count}只, 失败: {failed_count}只")
            logger.info(f"剩余缺失F10数据: {total_missing - end_index}只")
            
            return True
            
        except Exception as e:
            logger.error(f"F10数据爬取失败: {e}")
            return False
    
    def _crawl_single_f10(self, symbol, name):
        """爬取单只股票的F10数据"""
        try:
            # 尝试多个F10数据接口
            f10_methods = [
                self._get_f10_from_individual_info,
                self._get_f10_from_basic_info
            ]
            
            for method in f10_methods:
                try:
                    f10_data = method(symbol, name)
                    if f10_data:
                        db_manager.insert_stock_f10([f10_data])
                        return True
                except Exception as e:
                    logger.debug(f"F10方法失败: {e}")
                    continue
            
            return False
            
        except Exception as e:
            logger.error(f"爬取{symbol} F10数据异常: {e}")
            return False
    
    def _get_f10_from_individual_info(self, symbol, name):
        """从个股信息获取F10数据"""
        try:
            df = ak.stock_individual_info_em(symbol=symbol)
            if df.empty:
                return None
            
            info_dict = dict(zip(df['item'], df['value']))
            
            return {
                'symbol': symbol,
                'name': name,
                'companyName': self._safe_str(info_dict.get('公司名称', ''), 100),
                'industry': self._safe_str(info_dict.get('所属行业', ''), 50),
                'mainBusiness': self._safe_str(info_dict.get('主营业务', ''), 100),
                'businessScope': self._safe_str(info_dict.get('经营范围', ''), 1000),
                'listDate': self._parse_date(info_dict.get('上市时间')),
                'totalShares': self._parse_shares(info_dict.get('总股本')),
                'circulationShares': self._parse_shares(info_dict.get('流通股')),
                'chairman': self._safe_str(info_dict.get('董事长', ''), 50),
                'generalManager': self._safe_str(info_dict.get('总经理', ''), 50),
                'secretary': self._safe_str(info_dict.get('董秘', ''), 50),
                'website': self._safe_str(info_dict.get('公司网址', ''), 100),
                'address': self._safe_str(info_dict.get('办公地址', ''), 200),
                'introduction': self._safe_str(info_dict.get('公司简介', ''), 1000)
            }
        except Exception as e:
            logger.debug(f"个股信息接口失败: {e}")
            return None
    
    def _get_f10_from_basic_info(self, symbol, name):
        """从基本信息获取F10数据（备用方法）"""
        try:
            # 如果主要接口失败，至少插入基本信息
            return {
                'symbol': symbol,
                'name': name,
                'companyName': name,  # 使用股票名称作为公司名称
                'industry': '',
                'mainBusiness': '',
                'businessScope': None,
                'listDate': None,
                'totalShares': None,
                'circulationShares': None,
                'chairman': '',
                'generalManager': '',
                'secretary': '',
                'website': '',
                'address': '',
                'introduction': None
            }
        except:
            return None
    
    def _safe_str(self, value, max_length):
        """安全字符串转换"""
        if not value or pd.isna(value):
            return ''
        return str(value)[:max_length]
    
    def _parse_date(self, value):
        """解析日期"""
        if not value or pd.isna(value):
            return None
        
        try:
            date_str = str(value).strip()
            if len(date_str) >= 8:
                return date_str[:10]
            return None
        except:
            return None
    
    def _parse_shares(self, value):
        """解析股本数据"""
        if not value or pd.isna(value):
            return None
        
        try:
            value_str = str(value).replace(',', '').replace('--', '')
            if '万' in value_str:
                return int(float(value_str.replace('万', '')) * 10000)
            elif '亿' in value_str:
                return int(float(value_str.replace('亿', '')) * 100000000)
            else:
                return int(float(value_str)) if float(value_str) > 0 else None
        except:
            return None
    
    def run_auto_f10_crawl(self):
        """自动爬取所有缺失的F10数据"""
        logger.info("开始自动F10数据爬取...")
        
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        try:
            # 获取缺失F10数据的股票总数
            missing_count_result = db_manager.execute_query("""
                SELECT COUNT(*) 
                FROM stock_info s 
                LEFT JOIN stock_f10 f ON s.symbol = f.symbol 
                WHERE s.isActive = 1 AND f.symbol IS NULL
            """)
            
            total_missing = missing_count_result[0][0] if missing_count_result else 0
            
            if total_missing == 0:
                logger.info("所有股票都已有F10数据，无需处理")
                return True
            
            logger.info(f"总共需要处理 {total_missing} 只股票的F10数据")
            
            # 计算批次数
            batch_size = 30  # F10数据用较小批次，提高成功率
            total_batches = (total_missing + batch_size - 1) // batch_size
            
            logger.info(f"将分 {total_batches} 个批次处理，每批 {batch_size} 只股票")
            
            total_success = 0
            total_failed = 0
            start_time = datetime.now()
            
            # 逐批处理
            for batch_num in range(total_batches):
                start_index = batch_num * batch_size
                
                logger.info(f"=== 开始第 {batch_num + 1}/{total_batches} 批次 ===")
                
                batch_start_time = datetime.now()
                
                try:
                    # 执行批次爬取
                    success = self.crawl_all_f10_data(
                        start_index=start_index,
                        batch_size=batch_size
                    )
                    
                    if success:
                        batch_duration = (datetime.now() - batch_start_time).total_seconds()
                        logger.info(f"第 {batch_num + 1} 批次完成，耗时 {batch_duration:.1f}秒")
                        
                        # 显示进度
                        progress = ((batch_num + 1) / total_batches) * 100
                        logger.info(f"总体进度: {progress:.1f}% ({batch_num + 1}/{total_batches})")
                        
                    else:
                        logger.error(f"第 {batch_num + 1} 批次执行失败")
                
                except Exception as e:
                    logger.error(f"第 {batch_num + 1} 批次执行异常: {e}")
                
                # 批次间延迟（最后一批不需要延迟）
                if batch_num < total_batches - 1:
                    delay_time = 30  # F10数据批次间延迟30秒
                    logger.info(f"批次间休息 {delay_time} 秒...")
                    time.sleep(delay_time)
            
            # 总结
            total_duration = (datetime.now() - start_time).total_seconds()
            
            # 获取最终统计
            final_missing_result = db_manager.execute_query("""
                SELECT COUNT(*) 
                FROM stock_info s 
                LEFT JOIN stock_f10 f ON s.symbol = f.symbol 
                WHERE s.isActive = 1 AND f.symbol IS NULL
            """)
            final_missing = final_missing_result[0][0] if final_missing_result else 0
            
            processed = total_missing - final_missing
            
            logger.info("=== F10数据自动爬取完成 ===")
            logger.info(f"总耗时: {total_duration:.1f}秒 ({total_duration/60:.1f}分钟)")
            logger.info(f"处理结果: 已处理 {processed} 只股票")
            logger.info(f"剩余缺失: {final_missing} 只股票")
            
            # 显示最终F10数据统计
            self._show_f10_statistics()
            
            return True
            
        except KeyboardInterrupt:
            logger.info("用户中断F10数据爬取")
            return False
        except Exception as e:
            logger.error(f"F10数据自动爬取异常: {e}")
            return False
    
    def _show_f10_statistics(self):
        """显示F10数据统计"""
        try:
            conn = db_manager.get_connection()
            with conn.cursor() as cursor:
                # 总股票数
                cursor.execute("SELECT COUNT(*) FROM stock_info WHERE isActive = 1")
                total_stocks = cursor.fetchone()[0]
                
                # F10数据数量
                cursor.execute("SELECT COUNT(*) FROM stock_f10")
                f10_total = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_f10")
                f10_unique = cursor.fetchone()[0]
                
                # 缺失F10数据的股票
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM stock_info s 
                    LEFT JOIN stock_f10 f ON s.symbol = f.symbol 
                    WHERE s.isActive = 1 AND f.symbol IS NULL
                """)
                missing_f10 = cursor.fetchone()[0]
                
                logger.info("=== F10数据统计 ===")
                logger.info(f"总股票数: {total_stocks}")
                logger.info(f"F10数据总条数: {f10_total}")
                logger.info(f"有F10数据的股票数: {f10_unique}")
                logger.info(f"F10数据覆盖率: {f10_unique}/{total_stocks} ({f10_unique/total_stocks*100:.1f}%)")
                logger.info(f"仍缺失F10数据: {missing_f10} 只")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"获取F10统计失败: {e}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='F10数据专项爬虫')
    parser.add_argument('--mode', choices=['auto', 'batch'], default='auto',
                       help='运行模式: auto=自动处理所有, batch=单批次处理')
    parser.add_argument('--start', type=int, default=0, help='开始索引 (batch模式)')
    parser.add_argument('--batch', type=int, default=30, help='批次大小')
    
    args = parser.parse_args()
    
    # 设置日志
    logger.remove()
    logger.add(
        sys.stdout,
        level=Config.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    logger.add(
        Config.LOG_FILE.replace('.log', '_f10.log'),
        level=Config.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )
    
    logger.info("F10数据专项爬虫启动...")
    logger.info(f"运行模式: {args.mode}")
    
    crawler = F10OnlyCrawler()
    
    try:
        if args.mode == 'auto':
            success = crawler.run_auto_f10_crawl()
        else:  # batch
            success = crawler.crawl_all_f10_data(
                start_index=args.start,
                batch_size=args.batch
            )
        
        if success:
            logger.info("F10数据爬取任务完成")
            return 0
        else:
            logger.error("F10数据爬取任务失败")
            return 1
            
    except KeyboardInterrupt:
        logger.info("用户中断程序")
        return 1
    except Exception as e:
        logger.error(f"程序执行异常: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())