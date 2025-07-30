#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
sys.path.append('.')
from database import db_manager
from loguru import logger

def test_database_operations():
    """测试数据库操作是否正常"""
    logger.info("开始测试数据库操作...")
    
    try:
        # 测试连接
        if not db_manager.test_connection():
            logger.error("数据库连接失败")
            return False
        
        # 测试F10数据插入
        logger.info("测试F10数据插入...")
        test_f10_data = [{
            'symbol': 'TEST001',
            'name': '测试股票',
            'companyName': '测试公司有限公司',
            'industry': '测试行业',
            'mainBusiness': '测试主营业务',
            'businessScope': '测试经营范围',
            'listDate': '2020-01-01',
            'totalShares': 1000000000,
            'circulationShares': 800000000,
            'chairman': '测试董事长',
            'generalManager': '测试总经理',
            'secretary': '测试董秘',
            'website': 'http://test.com',
            'address': '测试地址',
            'introduction': '测试公司简介'
        }]
        
        result = db_manager.insert_stock_f10(test_f10_data)
        if result:
            logger.info("✓ F10数据插入测试成功")
        else:
            logger.error("✗ F10数据插入测试失败")
        
        # 测试财务数据插入
        logger.info("测试财务数据插入...")
        test_financial_data = [{
            'symbol': 'TEST001',
            'name': '测试股票',
            'reportDate': '2023-12-31',
            'reportType': '年报',
            'revenue': 1000000000,
            'netProfit': 100000000,
            'totalAssets': 5000000000,
            'totalLiabilities': 3000000000,
            'shareholderEquity': 2000000000,
            'operatingCashFlow': 150000000,
            'eps': 0.10,
            'roe': 0.05,
            'roa': 0.02,
            'grossMargin': 0.30,
            'netMargin': 0.10,
            'debtRatio': 0.60
        }]
        
        result = db_manager.insert_stock_financial(test_financial_data)
        if result:
            logger.info("✓ 财务数据插入测试成功")
        else:
            logger.error("✗ 财务数据插入测试失败")
        
        # 测试分红数据插入
        logger.info("测试分红数据插入...")
        test_dividend_data = [{
            'symbol': 'TEST001',
            'name': '测试股票',
            'recordDate': '2023-06-30',
            'exDividendDate': '2023-07-01',
            'paymentDate': '2023-07-15',
            'dividendPerShare': 0.05,
            'bonusShareRatio': 0.1,
            'rightIssueRatio': 0.0,
            'totalDividend': 50000000,
            'dividendYield': 0.025,
            'dividendPlan': '每10股派0.5元送1股',
            'status': '已实施'
        }]
        
        result = db_manager.insert_stock_dividend(test_dividend_data)
        if result:
            logger.info("✓ 分红数据插入测试成功")
        else:
            logger.error("✗ 分红数据插入测试失败")
        
        # 清理测试数据
        logger.info("清理测试数据...")
        conn = db_manager.get_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM stock_f10 WHERE symbol = 'TEST001'")
            cursor.execute("DELETE FROM stock_financial WHERE symbol = 'TEST001'")
            cursor.execute("DELETE FROM stock_dividend WHERE symbol = 'TEST001'")
        conn.close()
        logger.info("测试数据清理完成")
        
        logger.info("所有数据库操作测试完成")
        return True
        
    except Exception as e:
        logger.error(f"数据库操作测试失败: {e}")
        return False

def get_current_stats():
    """获取当前数据统计"""
    logger.info("获取当前数据统计...")
    
    try:
        conn = db_manager.get_connection()
        with conn.cursor() as cursor:
            # 获取各表记录数
            tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']
            stats = {}
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                stats[table] = count
                logger.info(f"{table}: {count}条记录")
            
            # 检查重复数据
            cursor.execute("""
                SELECT COUNT(*) as total, 
                       COUNT(DISTINCT CONCAT(symbol, date)) as unique_count
                FROM stock_data
            """)
            result = cursor.fetchone()
            total_data = result[0]
            unique_data = result[1]
            duplicates = total_data - unique_data
            
            logger.info(f"stock_data重复情况: 总记录{total_data}条, 唯一记录{unique_data}条, 重复{duplicates}条")
            
        conn.close()
        return stats
        
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        return {}

if __name__ == '__main__':
    logger.info("=== 数据库修复验证测试 ===")
    
    # 1. 获取当前统计
    current_stats = get_current_stats()
    
    # 2. 测试数据库操作
    test_success = test_database_operations()
    
    if test_success:
        logger.info("✓ 数据库修复验证成功，可以开始使用增强爬虫")
    else:
        logger.error("✗ 数据库修复验证失败，需要进一步检查")