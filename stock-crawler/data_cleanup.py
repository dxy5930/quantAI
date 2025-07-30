#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql
from loguru import logger
from config import Config
from database import db_manager

class DataCleanup:
    def __init__(self):
        self.db_config = {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'database': Config.DB_NAME,
            'charset': 'utf8mb4',
            'autocommit': True
        }
    
    def get_connection(self):
        return pymysql.connect(**self.db_config)
    
    def analyze_duplicates(self):
        """分析重复数据"""
        logger.info("开始分析数据重复情况...")
        
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 检查stock_data重复数据
                cursor.execute("""
                    SELECT symbol, date, COUNT(*) as cnt 
                    FROM stock_data 
                    GROUP BY symbol, date 
                    HAVING cnt > 1 
                    ORDER BY cnt DESC 
                    LIMIT 20
                """)
                duplicates = cursor.fetchall()
                
                if duplicates:
                    logger.warning(f"发现{len(duplicates)}组重复的股票交易数据:")
                    total_duplicates = 0
                    for symbol, date, count in duplicates:
                        logger.warning(f"  {symbol} - {date}: {count}条重复")
                        total_duplicates += count - 1
                    logger.warning(f"总计多余数据: {total_duplicates}条")
                else:
                    logger.info("stock_data表没有发现重复数据")
                
                # 检查数据一致性
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_info")
                info_symbols = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_data")
                data_symbols = cursor.fetchone()[0]
                
                logger.info(f"stock_info中的股票数: {info_symbols}")
                logger.info(f"stock_data中的股票数: {data_symbols}")
                
                if data_symbols > info_symbols:
                    # 找出stock_data中有但stock_info中没有的股票
                    cursor.execute("""
                        SELECT DISTINCT d.symbol 
                        FROM stock_data d 
                        LEFT JOIN stock_info i ON d.symbol = i.symbol 
                        WHERE i.symbol IS NULL
                    """)
                    orphan_symbols = cursor.fetchall()
                    if orphan_symbols:
                        logger.warning(f"发现{len(orphan_symbols)}只股票在stock_data中但不在stock_info中:")
                        for symbol in orphan_symbols[:10]:  # 只显示前10个
                            logger.warning(f"  {symbol[0]}")
            
            conn.close()
            return duplicates
            
        except Exception as e:
            logger.error(f"分析重复数据失败: {e}")
            return []
    
    def clean_duplicates(self):
        """清理重复数据"""
        logger.info("开始清理重复数据...")
        
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 删除重复的stock_data记录，保留最新的
                delete_query = """
                    DELETE d1 FROM stock_data d1
                    INNER JOIN stock_data d2 
                    WHERE d1.symbol = d2.symbol 
                    AND d1.date = d2.date 
                    AND d1.id < d2.id
                """
                
                cursor.execute(delete_query)
                deleted_count = cursor.rowcount
                logger.info(f"删除了{deleted_count}条重复的交易数据")
                
                # 清理孤立的交易数据（在stock_data中但不在stock_info中的）
                cursor.execute("""
                    DELETE d FROM stock_data d 
                    LEFT JOIN stock_info i ON d.symbol = i.symbol 
                    WHERE i.symbol IS NULL
                """)
                orphan_deleted = cursor.rowcount
                logger.info(f"删除了{orphan_deleted}条孤立的交易数据")
            
            conn.close()
            return deleted_count + orphan_deleted
            
        except Exception as e:
            logger.error(f"清理重复数据失败: {e}")
            return 0
    
    def check_indexes(self):
        """检查和创建必要的索引"""
        logger.info("检查数据库索引...")
        
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                # 检查stock_data表的唯一索引
                cursor.execute("""
                    SHOW INDEX FROM stock_data 
                    WHERE Key_name = 'unique_symbol_date'
                """)
                
                if not cursor.fetchall():
                    logger.info("创建stock_data表的唯一索引...")
                    cursor.execute("""
                        ALTER TABLE stock_data 
                        ADD UNIQUE INDEX unique_symbol_date (symbol, date)
                    """)
                    logger.info("唯一索引创建成功")
                else:
                    logger.info("stock_data表已有唯一索引")
                
                # 检查其他重要索引
                indexes_to_check = [
                    ('stock_info', 'symbol', 'UNIQUE'),
                    ('stock_f10', 'symbol', 'UNIQUE'),
                    ('stock_data', 'symbol', 'INDEX'),
                    ('stock_data', 'date', 'INDEX'),
                ]
                
                for table, column, index_type in indexes_to_check:
                    cursor.execute(f"""
                        SHOW INDEX FROM {table} 
                        WHERE Column_name = '{column}'
                    """)
                    
                    if not cursor.fetchall():
                        if index_type == 'UNIQUE':
                            cursor.execute(f"""
                                ALTER TABLE {table} 
                                ADD UNIQUE INDEX idx_{column} ({column})
                            """)
                        else:
                            cursor.execute(f"""
                                ALTER TABLE {table} 
                                ADD INDEX idx_{column} ({column})
                            """)
                        logger.info(f"为{table}.{column}创建了{index_type}索引")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"检查索引失败: {e}")
    
    def get_statistics(self):
        """获取数据统计信息"""
        logger.info("获取数据库统计信息...")
        
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                stats = {}
                
                # 各表的记录数
                tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    stats[table] = cursor.fetchone()[0]
                
                # 股票数据的日期范围
                cursor.execute("""
                    SELECT MIN(date) as min_date, MAX(date) as max_date, 
                           COUNT(DISTINCT date) as date_count
                    FROM stock_data
                """)
                date_info = cursor.fetchone()
                stats['date_range'] = {
                    'min_date': date_info[0],
                    'max_date': date_info[1],
                    'date_count': date_info[2]
                }
                
                # 每日数据量
                cursor.execute("""
                    SELECT date, COUNT(*) as count 
                    FROM stock_data 
                    GROUP BY date 
                    ORDER BY date DESC 
                    LIMIT 10
                """)
                daily_counts = cursor.fetchall()
                stats['daily_counts'] = daily_counts
                
                logger.info("=== 数据库统计信息 ===")
                for table, count in stats.items():
                    if table != 'date_range' and table != 'daily_counts':
                        logger.info(f"{table}: {count}条")
                
                if stats['date_range']['min_date']:
                    logger.info(f"数据日期范围: {stats['date_range']['min_date']} 到 {stats['date_range']['max_date']}")
                    logger.info(f"共{stats['date_range']['date_count']}个交易日")
                
                logger.info("最近10天的数据量:")
                for date, count in stats['daily_counts']:
                    logger.info(f"  {date}: {count}条")
            
            conn.close()
            return stats
            
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}

def main():
    """主函数"""
    logger.info("开始数据清理和分析...")
    
    cleanup = DataCleanup()
    
    # 1. 分析重复数据
    duplicates = cleanup.analyze_duplicates()
    
    # 2. 获取统计信息
    stats = cleanup.get_statistics()
    
    # 3. 如果有重复数据，询问是否清理
    if duplicates:
        response = input("发现重复数据，是否清理？(y/n): ")
        if response.lower() == 'y':
            deleted = cleanup.clean_duplicates()
            logger.info(f"清理完成，删除了{deleted}条重复数据")
            
            # 重新获取统计信息
            logger.info("清理后的统计信息:")
            cleanup.get_statistics()
    
    # 4. 检查和创建索引
    cleanup.check_indexes()
    
    logger.info("数据清理和分析完成")

if __name__ == '__main__':
    main()