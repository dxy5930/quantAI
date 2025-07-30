#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import akshare as ak
import pandas as pd
import time
import schedule
from datetime import datetime, timedelta
from loguru import logger
from config import Config
from database import db_manager
import random
import sys
import os

class DailyStockSyncer:
    def __init__(self):
        self.delay = Config.CRAWL_DELAY
        self.batch_size = Config.BATCH_SIZE
        self.max_retries = Config.MAX_RETRIES
        
    def daily_sync_task(self):
        """每日同步任务"""
        logger.info("=" * 60)
        logger.info(f"开始执行每日股票数据同步任务 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        
        try:
            # 1. 同步股票列表（检查新股）
            logger.info("步骤1: 同步股票列表，检查新上市股票")
            new_stocks, updated_stocks = self.sync_stock_list()
            
            # 2. 为新股票获取完整数据
            if new_stocks:
                logger.info(f"步骤2: 为{len(new_stocks)}只新股票获取完整数据")
                self.crawl_new_stocks_data(new_stocks)
            else:
                logger.info("步骤2: 没有发现新股票")
            
            # 3. 增量更新现有股票的F10、财务、分红数据
            logger.info("步骤3: 增量更新现有股票数据")
            self.incremental_update_existing_stocks()
            
            # 4. 数据质量检查
            logger.info("步骤4: 数据质量检查")
            self.data_quality_check()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info("=" * 60)
            logger.info("每日同步任务完成")
            logger.info(f"总耗时: {duration:.2f}秒")
            logger.info(f"新增股票: {len(new_stocks)}只")
            logger.info(f"更新股票: {len(updated_stocks)}只")
            logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            logger.error(f"每日同步任务执行失败: {e}")
            return False
    
    def sync_stock_list(self):
        """同步股票列表"""
        logger.info("正在获取最新股票列表...")
        
        try:
            # 获取最新的股票列表
            df = ak.stock_zh_a_spot_em()
            
            if df.empty:
                logger.warning("没有获取到股票数据")
                return [], []
            
            logger.info(f"从akshare获取到{len(df)}只股票")
            
            # 获取数据库中现有的股票
            existing_stocks = db_manager.execute_query(
                "SELECT symbol, name, updatedAt FROM stock_info"
            )
            existing_dict = {row[0]: {'name': row[1], 'updated': row[2]} for row in existing_stocks} if existing_stocks else {}
            
            new_stocks = []
            updated_stocks = []
            
            # 处理每只股票
            for _, row in df.iterrows():
                symbol = str(row.get('代码', ''))
                name = str(row.get('名称', ''))
                
                if not symbol or not name:
                    continue
                
                stock_info, stock_data = self._process_stock_row(row)
                
                if symbol not in existing_dict:
                    # 新股票
                    new_stocks.append({
                        'symbol': symbol,
                        'name': name,
                        'stock_info': stock_info,
                        'stock_data': stock_data
                    })
                    logger.info(f"发现新股票: {symbol} {name}")
                else:
                    # 现有股票，检查是否需要更新
                    if existing_dict[symbol]['name'] != name:
                        updated_stocks.append({
                            'symbol': symbol,
                            'name': name,
                            'stock_info': stock_info,
                            'stock_data': stock_data
                        })
                        logger.info(f"股票信息变更: {symbol} {existing_dict[symbol]['name']} -> {name}")
            
            # 批量插入新股票
            if new_stocks:
                self._insert_new_stocks(new_stocks)
            
            # 批量更新现有股票
            if updated_stocks:
                self._update_existing_stocks(updated_stocks)
            
            return new_stocks, updated_stocks
            
        except Exception as e:
            logger.error(f"同步股票列表失败: {e}")
            return [], []
    
    def _process_stock_row(self, row):
        """处理单只股票数据"""
        try:
            symbol = str(row.get('代码', ''))
            name = str(row.get('名称', ''))
            
            # 股票基本信息
            stock_info = {
                'symbol': symbol,
                'name': name,
                'industry': str(row.get('所属行业', '未知')),
                'sector': self._get_sector_by_symbol(symbol),
                'market': 'ALL',
                'listDate': '2000-01-01',  # 默认上市日期
                'marketCap': float(row.get('总市值', 0)) if pd.notna(row.get('总市值')) else 0,
                'circulationMarketCap': float(row.get('流通市值', 0)) if pd.notna(row.get('流通市值')) else 0,
                'totalShares': float(row.get('总股本', 0)) if pd.notna(row.get('总股本')) else 0,
                'circulationShares': float(row.get('流通股', 0)) if pd.notna(row.get('流通股')) else 0,
                'peRatio': float(row.get('市盈率-动态', 0)) if pd.notna(row.get('市盈率-动态')) else 0,
                'pbRatio': float(row.get('市净率', 0)) if pd.notna(row.get('市净率')) else 0,
                'dividendYield': 0,
                'isActive': True,
            }
            
            # 当日交易数据
            today = datetime.now().strftime('%Y-%m-%d')
            stock_data = {
                'symbol': symbol,
                'name': name,
                'date': today,
                'open': float(row.get('今开', 0)) if pd.notna(row.get('今开')) else 0,
                'high': float(row.get('最高', 0)) if pd.notna(row.get('最高')) else 0,
                'low': float(row.get('最低', 0)) if pd.notna(row.get('最低')) else 0,
                'close': float(row.get('最新价', 0)) if pd.notna(row.get('最新价')) else 0,
                'volume': int(row.get('成交量', 0)) if pd.notna(row.get('成交量')) else 0,
                'amount': float(row.get('成交额', 0)) if pd.notna(row.get('成交额')) else 0,
                'changePercent': float(row.get('涨跌幅', 0)) if pd.notna(row.get('涨跌幅')) else 0,
                'changeAmount': float(row.get('涨跌额', 0)) if pd.notna(row.get('涨跌额')) else 0,
                'turnoverRate': float(row.get('换手率', 0)) if pd.notna(row.get('换手率')) else 0,
            }
            
            return stock_info, stock_data
            
        except Exception as e:
            logger.error(f"处理股票行数据失败: {e}")
            return None, None
    
    def _get_sector_by_symbol(self, symbol):
        """根据股票代码判断板块"""
        if symbol.startswith('688'):
            return '科创板'
        elif symbol.startswith('300'):
            return '创业板'
        elif symbol.startswith('002'):
            return '中小板'
        elif symbol.startswith('6'):
            return '主板'
        elif symbol.startswith('0'):
            return '主板'
        elif symbol.startswith('8') or symbol.startswith('4'):
            return '北交所'
        else:
            return '其他'
    
    def _insert_new_stocks(self, new_stocks):
        """插入新股票"""
        try:
            stock_info_list = []
            stock_data_list = []
            
            for stock in new_stocks:
                stock_info_list.append(stock['stock_info'])
                stock_data_list.append(stock['stock_data'])
            
            # 插入股票基本信息
            db_manager.insert_stock_info(stock_info_list)
            
            # 插入交易数据
            db_manager.insert_stock_data(stock_data_list)
            
            logger.info(f"成功插入{len(new_stocks)}只新股票")
            
        except Exception as e:
            logger.error(f"插入新股票失败: {e}")
    
    def _update_existing_stocks(self, updated_stocks):
        """更新现有股票"""
        try:
            stock_info_list = []
            stock_data_list = []
            
            for stock in updated_stocks:
                stock_info_list.append(stock['stock_info'])
                stock_data_list.append(stock['stock_data'])
            
            # 更新股票基本信息
            db_manager.upsert_stock_info(stock_info_list)
            
            # 插入最新交易数据
            db_manager.insert_stock_data(stock_data_list)
            
            logger.info(f"成功更新{len(updated_stocks)}只股票")
            
        except Exception as e:
            logger.error(f"更新现有股票失败: {e}")
    
    def crawl_new_stocks_data(self, new_stocks):
        """为新股票爬取完整数据"""
        logger.info(f"开始为{len(new_stocks)}只新股票爬取完整数据...")
        
        stats = {'f10_success': 0, 'f10_failed': 0, 'financial_success': 0, 'financial_failed': 0, 'dividend_success': 0, 'dividend_failed': 0}
        
        for i, stock in enumerate(new_stocks):
            symbol = stock['symbol']
            name = stock['name']
            
            logger.info(f"正在处理新股票 {symbol} {name} ({i+1}/{len(new_stocks)})")
            
            try:
                # 1. F10数据
                if self._crawl_single_f10(symbol, name):
                    stats['f10_success'] += 1
                else:
                    stats['f10_failed'] += 1
                
                time.sleep(random.uniform(1.0, 2.0))
                
                # 2. 财务数据
                if self._crawl_single_financial(symbol, name):
                    stats['financial_success'] += 1
                else:
                    stats['financial_failed'] += 1
                
                time.sleep(random.uniform(1.0, 2.0))
                
                # 3. 分红数据
                if self._crawl_single_dividend(symbol, name):
                    stats['dividend_success'] += 1
                else:
                    stats['dividend_failed'] += 1
                
                time.sleep(random.uniform(1.0, 2.0))
                
            except Exception as e:
                logger.error(f"处理新股票{symbol}数据失败: {e}")
        
        logger.info(f"新股票数据爬取完成: F10({stats['f10_success']}/{len(new_stocks)}), 财务({stats['financial_success']}/{len(new_stocks)}), 分红({stats['dividend_success']}/{len(new_stocks)})")
    
    def incremental_update_existing_stocks(self):
        """增量更新现有股票数据 - 全量处理，不限制数量"""
        logger.info("开始全量更新现有股票数据...")
        
        try:
            # 获取需要更新的股票（按优先级）
            update_candidates = self._get_update_candidates()
            
            if not update_candidates:
                logger.info("没有需要更新的股票")
                return
            
            logger.info(f"计划更新{len(update_candidates)}只股票的数据（全量处理）")
            
            stats = {'f10_success': 0, 'f10_failed': 0, 'financial_success': 0, 'financial_failed': 0, 'dividend_success': 0, 'dividend_failed': 0}
            
            # 分批处理，提高效率
            batch_size = 50
            for batch_start in range(0, len(update_candidates), batch_size):
                batch_end = min(batch_start + batch_size, len(update_candidates))
                batch = update_candidates[batch_start:batch_end]
                
                logger.info(f"处理第{batch_start+1}-{batch_end}只股票...")
                
                for i, (symbol, name, priority) in enumerate(batch):
                    logger.info(f"正在更新 {symbol} {name} (优先级:{priority}) ({batch_start + i + 1}/{len(update_candidates)})")
                    
                    try:
                        # 全量更新策略：所有需要更新的数据都更新
                        if self._update_f10_if_needed(symbol, name):
                            stats['f10_success'] += 1
                        else:
                            stats['f10_failed'] += 1
                        
                        time.sleep(random.uniform(0.3, 0.8))  # 减少延迟
                        
                        if self._update_financial_if_needed(symbol, name):
                            stats['financial_success'] += 1
                        else:
                            stats['financial_failed'] += 1
                        
                        time.sleep(random.uniform(0.3, 0.8))
                        
                        if self._update_dividend_if_needed(symbol, name):
                            stats['dividend_success'] += 1
                        else:
                            stats['dividend_failed'] += 1
                        
                        time.sleep(random.uniform(0.5, 1.0))  # 股票间延迟
                        
                    except Exception as e:
                        logger.error(f"更新股票{symbol}数据失败: {e}")
                
                # 批次间稍长延迟
                if batch_end < len(update_candidates):
                    logger.info(f"批次完成，休息2秒...")
                    time.sleep(2.0)
            
            logger.info(f"全量更新完成: F10({stats['f10_success']}), 财务({stats['financial_success']}), 分红({stats['dividend_success']})")
            
        except Exception as e:
            logger.error(f"增量更新失败: {e}")
    
    def _get_update_candidates(self):
        """获取需要更新的股票候选列表"""
        try:
            # 优先级策略：
            # 1. 高优先级：大盘股（市值大）、近期没有更新的
            # 2. 中优先级：中盘股
            # 3. 低优先级：小盘股
            
            query = """
                SELECT s.symbol, s.name, s.marketCap,
                       COALESCE(f.updatedAt, '1900-01-01') as f10_updated,
                       COALESCE(fin.updatedAt, '1900-01-01') as financial_updated,
                       COALESCE(d.updatedAt, '1900-01-01') as dividend_updated
                FROM stock_info s
                LEFT JOIN stock_f10 f ON s.symbol = f.symbol
                LEFT JOIN (SELECT symbol, MAX(updatedAt) as updatedAt FROM stock_financial GROUP BY symbol) fin ON s.symbol = fin.symbol
                LEFT JOIN (SELECT symbol, MAX(updatedAt) as updatedAt FROM stock_dividend GROUP BY symbol) d ON s.symbol = d.symbol
                WHERE s.isActive = 1
                ORDER BY s.marketCap DESC
            """
            
            results = db_manager.execute_query(query)
            if not results:
                return []
            
            candidates = []
            now = datetime.now()
            
            for row in results:
                symbol, name, market_cap, f10_updated, financial_updated, dividend_updated = row
                
                # 计算优先级
                priority = 'low'
                
                # 市值优先级
                if market_cap > 100000000000:  # 1000亿以上
                    priority = 'high'
                elif market_cap > 10000000000:  # 100亿以上
                    priority = 'medium'
                
                # 时间优先级（超过7天没更新的提高优先级）
                if isinstance(f10_updated, str):
                    if f10_updated == '1900-01-01':
                        f10_updated = datetime(1900, 1, 1)
                    else:
                        f10_updated = datetime.strptime(f10_updated, '%Y-%m-%d %H:%M:%S')
                if isinstance(financial_updated, str):
                    if financial_updated == '1900-01-01':
                        financial_updated = datetime(1900, 1, 1)
                    else:
                        financial_updated = datetime.strptime(financial_updated, '%Y-%m-%d %H:%M:%S')
                if isinstance(dividend_updated, str):
                    if dividend_updated == '1900-01-01':
                        dividend_updated = datetime(1900, 1, 1)
                    else:
                        dividend_updated = datetime.strptime(dividend_updated, '%Y-%m-%d %H:%M:%S')
                
                days_since_f10 = (now - f10_updated).days
                days_since_financial = (now - financial_updated).days
                days_since_dividend = (now - dividend_updated).days
                
                if days_since_f10 > 7 or days_since_financial > 7 or days_since_dividend > 7:
                    if priority == 'low':
                        priority = 'medium'
                    elif priority == 'medium':
                        priority = 'high'
                
                candidates.append((symbol, name, priority))
            
            # 按优先级排序
            priority_order = {'high': 0, 'medium': 1, 'low': 2}
            candidates.sort(key=lambda x: priority_order[x[2]])
            
            return candidates
            
        except Exception as e:
            logger.error(f"获取更新候选列表失败: {e}")
            return []
    
    def _crawl_single_f10(self, symbol, name):
        """爬取单只股票的F10数据"""
        try:
            from complete_data_crawler import CompleteDataCrawler
            crawler = CompleteDataCrawler()
            return crawler._crawl_single_f10(symbol, name)
        except Exception as e:
            logger.error(f"爬取{symbol} F10数据失败: {e}")
            return False
    
    def _crawl_single_financial(self, symbol, name):
        """爬取单只股票的财务数据"""
        try:
            from complete_data_crawler import CompleteDataCrawler
            crawler = CompleteDataCrawler()
            return crawler._crawl_single_financial(symbol, name)
        except Exception as e:
            logger.error(f"爬取{symbol}财务数据失败: {e}")
            return False
    
    def _crawl_single_dividend(self, symbol, name):
        """爬取单只股票的分红数据"""
        try:
            from complete_data_crawler import CompleteDataCrawler
            crawler = CompleteDataCrawler()
            return crawler._crawl_single_dividend(symbol, name)
        except Exception as e:
            logger.error(f"爬取{symbol}分红数据失败: {e}")
            return False
    
    def _update_f10_if_needed(self, symbol, name):
        """如果需要则更新F10数据"""
        try:
            # 检查是否需要更新（比如超过30天没更新）
            result = db_manager.execute_query(
                "SELECT updatedAt FROM stock_f10 WHERE symbol = %s", (symbol,)
            )
            
            if not result:
                # 没有F10数据，需要爬取
                return self._crawl_single_f10(symbol, name)
            
            last_updated = result[0][0]
            if isinstance(last_updated, str):
                last_updated = datetime.strptime(last_updated, '%Y-%m-%d %H:%M:%S')
            
            days_since_update = (datetime.now() - last_updated).days
            
            if days_since_update > 30:  # 超过30天更新F10
                return self._crawl_single_f10(symbol, name)
            
            return True  # 不需要更新
            
        except Exception as e:
            logger.error(f"检查{symbol} F10更新需求失败: {e}")
            return False
    
    def _update_financial_if_needed(self, symbol, name):
        """如果需要则更新财务数据"""
        try:
            # 检查最新财务数据日期
            result = db_manager.execute_query(
                "SELECT MAX(reportDate) FROM stock_financial WHERE symbol = %s", (symbol,)
            )
            
            if not result or not result[0][0]:
                # 没有财务数据，需要爬取
                return self._crawl_single_financial(symbol, name)
            
            latest_report = result[0][0]
            if isinstance(latest_report, str):
                latest_report = datetime.strptime(latest_report, '%Y-%m-%d')
            
            # 如果最新财务数据超过3个月，尝试更新
            months_since_report = (datetime.now() - latest_report).days / 30
            
            if months_since_report > 3:
                return self._crawl_single_financial(symbol, name)
            
            return True  # 不需要更新
            
        except Exception as e:
            logger.error(f"检查{symbol}财务更新需求失败: {e}")
            return False
    
    def _update_dividend_if_needed(self, symbol, name):
        """如果需要则更新分红数据"""
        try:
            # 检查最新分红数据日期
            result = db_manager.execute_query(
                "SELECT MAX(recordDate) FROM stock_dividend WHERE symbol = %s", (symbol,)
            )
            
            if not result or not result[0][0]:
                # 没有分红数据，需要爬取
                return self._crawl_single_dividend(symbol, name)
            
            latest_dividend = result[0][0]
            if isinstance(latest_dividend, str):
                latest_dividend = datetime.strptime(latest_dividend, '%Y-%m-%d')
            
            # 如果最新分红数据超过6个月，尝试更新
            months_since_dividend = (datetime.now() - latest_dividend).days / 30
            
            if months_since_dividend > 6:
                return self._crawl_single_dividend(symbol, name)
            
            return True  # 不需要更新
            
        except Exception as e:
            logger.error(f"检查{symbol}分红更新需求失败: {e}")
            return False
    
    def data_quality_check(self):
        """数据质量检查"""
        logger.info("开始数据质量检查...")
        
        try:
            conn = db_manager.get_connection()
            with conn.cursor() as cursor:
                # 检查各表数据量
                tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']
                stats = {}
                
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    stats[table] = cursor.fetchone()[0]
                
                # 检查数据覆盖率
                cursor.execute("SELECT COUNT(*) FROM stock_info WHERE isActive = 1")
                active_stocks = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_f10")
                f10_coverage = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_financial")
                financial_coverage = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_dividend")
                dividend_coverage = cursor.fetchone()[0]
                
                logger.info("=== 数据质量报告 ===")
                for table, count in stats.items():
                    logger.info(f"{table}: {count}条")
                
                logger.info(f"活跃股票数: {active_stocks}")
                logger.info(f"F10数据覆盖率: {f10_coverage}/{active_stocks} ({f10_coverage/active_stocks*100:.1f}%)")
                logger.info(f"财务数据覆盖率: {financial_coverage}/{active_stocks} ({financial_coverage/active_stocks*100:.1f}%)")
                logger.info(f"分红数据覆盖率: {dividend_coverage}/{active_stocks} ({dividend_coverage/active_stocks*100:.1f}%)")
                
                # 检查今日数据
                cursor.execute("SELECT COUNT(*) FROM stock_data WHERE date = CURDATE()")
                today_data = cursor.fetchone()[0]
                logger.info(f"今日交易数据: {today_data}条")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"数据质量检查失败: {e}")

def setup_scheduler():
    """设置定时任务"""
    syncer = DailyStockSyncer()
    
    # 每天凌晨1点执行
    schedule.every().day.at("01:00").do(syncer.daily_sync_task)
    
    logger.info("定时任务已设置: 每天凌晨1点执行股票数据同步")
    
    return syncer

def run_scheduler():
    """运行定时任务调度器"""
    syncer = setup_scheduler()
    
    logger.info("定时任务调度器启动...")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每分钟检查一次
    except KeyboardInterrupt:
        logger.info("定时任务调度器停止")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='每日股票数据同步')
    parser.add_argument('--mode', choices=['once', 'schedule'], default='once', 
                       help='运行模式: once=立即执行一次, schedule=启动定时任务')
    
    args = parser.parse_args()
    
    # 设置日志
    log_dir = os.path.dirname(Config.LOG_FILE)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logger.remove()
    logger.add(
        sys.stdout,
        level=Config.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    logger.add(
        Config.LOG_FILE.replace('.log', '_daily.log'),
        level=Config.LOG_LEVEL,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )
    
    # 测试数据库连接
    if not db_manager.test_connection():
        logger.error("数据库连接失败")
        return 1
    
    try:
        if args.mode == 'once':
            # 立即执行一次
            syncer = DailyStockSyncer()
            success = syncer.daily_sync_task()
            return 0 if success else 1
        elif args.mode == 'schedule':
            # 启动定时任务
            run_scheduler()
            return 0
        
    except KeyboardInterrupt:
        logger.info("用户中断程序")
        return 1
    except Exception as e:
        logger.error(f"程序执行异常: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())