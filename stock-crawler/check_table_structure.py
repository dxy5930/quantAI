#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
sys.path.append('.')
from database import db_manager

def check_table_structure():
    """检查数据库表结构"""
    try:
        conn = db_manager.get_connection()
        with conn.cursor() as cursor:
            # 检查所有相关表的结构
            tables = ['stock_info', 'stock_data', 'stock_f10', 'stock_financial', 'stock_dividend']
            
            for table in tables:
                print(f"\n=== {table} 表结构 ===")
                cursor.execute(f"DESCRIBE {table}")
                columns = cursor.fetchall()
                
                for column in columns:
                    field_name = column[0]
                    field_type = column[1]
                    is_null = column[2]
                    key = column[3]
                    default = column[4]
                    extra = column[5]
                    print(f"  {field_name}: {field_type} {'NULL' if is_null == 'YES' else 'NOT NULL'} {key} {extra}")
        
        conn.close()
        
    except Exception as e:
        print(f"检查表结构失败: {e}")

if __name__ == '__main__':
    check_table_structure()