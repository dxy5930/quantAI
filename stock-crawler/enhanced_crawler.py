#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import akshare as ak
import pandas as pd
import time
from datetime import datetime, timedelta
from loguru import logger
from config import Config
from database import db_manager
import random

class EnhancedStockCrawler:
    def __init__(self):
        self.delay = Config.CRAWL_DELAY
        self.batch_size = Config.BATCH_SIZE
        self.max_retries = Config.MAX_RETRIES
    
    def crawl_missing_f10_data(self, limit=None):
        """爬取缺失的F10数据"""
        logger.info("开始爬取缺失的F10数据...")
        
        try:
            # 获取已有F10数据的股票代码
            existing_f10_symbols = set(db_manager.execute_query(
                "SELECT DISTINCT symbol FROM stock_f10"
            ) or [])
            existing_f10_symbols = {row[0] for row in existing_f10_symbols}
            
            # 获取所有股票代码
            all_symbols = db_manager.execute_query(
                "SELECT symbol FROM stock_info WHERE isActive = 1 ORDER BY symbol"
            )
            all_symbols = [row[0] for row in all_symbols] if all_symbols else []
            
            # 找出缺失F10数据的股票
            missing_symbols = [s for s in all_symbols if s not in existing_f10_symbols]
            
            if limit:
                missing_symbols = missing_symbols[:limit]
            
            logger.info(f"需要爬取F10数据的股票: {len(missing_symbols)}只")
            
            success_count = 0
            failed_count = 0
            
            for i, symbol in enumerate(missing_symbols):
                try:
                    logger.info(f"正在爬取 {symbol} 的F10数据 ({i+1}/{len(missing_symbols)})")
                    
                    f10_data = self._get_enhanced_f10_data(symbol)
                    if f10_data:
                        db_manager.insert_stock_f10([f10_data])
                        success_count += 1
                        logger.info(f"✓ {symbol} F10数据爬取成功")
                    else:
                        failed_count += 1
                        logger.warning(f"✗ {symbol} F10数据爬取失败")
                    
                    # 随机延迟，避免被限制
                    delay = self.delay + random.uniform(0.5, 2.0)
                    time.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"爬取{symbol}的F10数据异常: {e}")
                    failed_count += 1
                    time.sleep(self.delay * 2)
            
            logger.info(f"F10数据爬取完成: 成功{success_count}只, 失败{failed_count}只")
            return success_count, failed_count
            
        except Exception as e:
            logger.error(f"爬取F10数据失败: {e}")
            return 0, 0
    
    def _get_enhanced_f10_data(self, symbol):
        """获取增强的F10数据"""
        for attempt in range(self.max_retries):
            try:
                # 尝试多个数据源
                f10_data = None
                
                # 方法1: 使用个股信息
                try:
                    df = ak.stock_individual_info_em(symbol=symbol)
                    if not df.empty:
                        f10_data = self._parse_individual_info(symbol, df)
                except:
                    pass
                
                # 方法2: 如果方法1失败，尝试其他接口
                if not f10_data:
                    try:
                        # 获取股票基本信息
                        basic_info = ak.stock_individual_basic_info_em(symbol=symbol)
                        if not basic_info.empty:
                            f10_data = self._parse_basic_info(symbol, basic_info)
                    except:
                        pass
                
                return f10_data
                
            except Exception as e:
                logger.warning(f"第{attempt+1}次尝试获取{symbol}的F10数据失败: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.delay * (attempt + 1))
        
        return None
    
    def _parse_individual_info(self, symbol, df):
        """解析个股信息"""
        try:
            info_dict = dict(zip(df['item'], df['value']))
            
            # 获取股票名称
            stock_name = db_manager.execute_query("SELECT name FROM stock_info WHERE symbol = %s", (symbol,))
            stock_name = stock_name[0][0] if stock_name else ''
            
            return {
                'symbol': symbol,
                'name': stock_name,
                'companyName': str(info_dict.get('公司名称', ''))[:100],  # fullName字段
                'industry': str(info_dict.get('所属行业', ''))[:50],
                'mainBusiness': str(info_dict.get('主营业务', ''))[:100],
                'businessScope': str(info_dict.get('经营范围', ''))[:1000] if info_dict.get('经营范围') else None,
                'listDate': str(info_dict.get('上市时间', '')) if info_dict.get('上市时间') else None,
                'totalShares': self._parse_number(info_dict.get('总股本', 0)) or None,
                'circulationShares': self._parse_number(info_dict.get('流通股', 0)) or None,
                'chairman': str(info_dict.get('董事长', ''))[:50],  # legalRepresentative字段
                'generalManager': str(info_dict.get('总经理', ''))[:50],
                'secretary': str(info_dict.get('董秘', ''))[:50],  # boardSecretary字段
                'website': str(info_dict.get('公司网址', ''))[:100],
                'address': str(info_dict.get('办公地址', ''))[:200],  # officeAddress字段
                'introduction': str(info_dict.get('公司简介', ''))[:1000] if info_dict.get('公司简介') else None,  # companyProfile字段
            }
        except Exception as e:
            logger.error(f"解析{symbol}个股信息失败: {e}")
            return None
    
    def _parse_basic_info(self, symbol, df):
        """解析基本信息"""
        try:
            # 这里可以根据实际返回的数据结构进行解析
            return {
                'symbol': symbol,
                'companyName': '',
                'industry': '',
                'mainBusiness': '',
                'businessScope': '',
                'listDate': '2000-01-01',
                'totalShares': 0,
                'circulationShares': 0,
                'chairman': '',
                'generalManager': '',
                'secretary': '',
                'employees': 0,
                'website': '',
                'address': '',
                'introduction': '',
            }
        except Exception as e:
            logger.error(f"解析{symbol}基本信息失败: {e}")
            return None
    
    def crawl_missing_financial_data(self, limit=None):
        """爬取缺失的财务数据"""
        logger.info("开始爬取缺失的财务数据...")
        
        try:
            # 获取已有财务数据的股票代码
            existing_financial_symbols = set(db_manager.execute_query(
                "SELECT DISTINCT symbol FROM stock_financial"
            ) or [])
            existing_financial_symbols = {row[0] for row in existing_financial_symbols}
            
            # 获取所有股票代码
            all_symbols = db_manager.execute_query(
                "SELECT symbol FROM stock_info WHERE isActive = 1 ORDER BY marketCap DESC"
            )
            all_symbols = [row[0] for row in all_symbols] if all_symbols else []
            
            # 找出缺失财务数据的股票
            missing_symbols = [s for s in all_symbols if s not in existing_financial_symbols]
            
            if limit:
                missing_symbols = missing_symbols[:limit]
            
            logger.info(f"需要爬取财务数据的股票: {len(missing_symbols)}只")
            
            success_count = 0
            failed_count = 0
            
            for i, symbol in enumerate(missing_symbols):
                try:
                    logger.info(f"正在爬取 {symbol} 的财务数据 ({i+1}/{len(missing_symbols)})")
                    
                    financial_data = self._get_enhanced_financial_data(symbol)
                    if financial_data:
                        db_manager.insert_stock_financial(financial_data)
                        success_count += 1
                        logger.info(f"✓ {symbol} 财务数据爬取成功，{len(financial_data)}条记录")
                    else:
                        failed_count += 1
                        logger.warning(f"✗ {symbol} 财务数据爬取失败")
                    
                    # 财务数据请求间隔更长
                    delay = self.delay * 2 + random.uniform(1.0, 3.0)
                    time.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"爬取{symbol}的财务数据异常: {e}")
                    failed_count += 1
                    time.sleep(self.delay * 3)
            
            logger.info(f"财务数据爬取完成: 成功{success_count}只, 失败{failed_count}只")
            return success_count, failed_count
            
        except Exception as e:
            logger.error(f"爬取财务数据失败: {e}")
            return 0, 0
    
    def _get_enhanced_financial_data(self, symbol):
        """获取增强的财务数据"""
        for attempt in range(self.max_retries):
            try:
                financial_data = []
                
                # 尝试多个财务数据接口
                try:
                    # 方法1: 财务指标
                    df = ak.stock_financial_abstract_ths(symbol=symbol)
                    if not df.empty:
                        financial_data = self._parse_financial_abstract(symbol, df)
                except:
                    pass
                
                # 方法2: 如果方法1失败，尝试其他接口
                if not financial_data:
                    try:
                        # 获取利润表数据
                        profit_df = ak.stock_profit_sheet_by_report_em(symbol=symbol)
                        if not profit_df.empty:
                            financial_data = self._parse_profit_sheet(symbol, profit_df)
                    except:
                        pass
                
                return financial_data
                
            except Exception as e:
                logger.warning(f"第{attempt+1}次尝试获取{symbol}的财务数据失败: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.delay * (attempt + 2))
        
        return None
    
    def _parse_financial_abstract(self, symbol, df):
        """解析财务摘要数据"""
        try:
            # 获取股票名称
            stock_name = db_manager.execute_query("SELECT name FROM stock_info WHERE symbol = %s", (symbol,))
            stock_name = stock_name[0][0] if stock_name else ''
            
            financial_list = []
            for _, row in df.iterrows():
                financial_data = {
                    'symbol': symbol,
                    'name': stock_name,
                    'reportDate': str(row.get('报告期', '')),
                    'reportType': '年报',  # 默认为年报
                    'revenue': self._parse_financial_number(row.get('营业收入', 0)),
                    'netProfit': self._parse_financial_number(row.get('净利润', 0)),
                    'totalAssets': self._parse_financial_number(row.get('总资产', 0)),
                    'totalLiabilities': self._parse_financial_number(row.get('总负债', 0)),
                    'shareholderEquity': self._parse_financial_number(row.get('股东权益', 0)),
                    'operatingCashFlow': self._parse_financial_number(row.get('经营现金流', 0)),
                    'eps': self._parse_financial_number(row.get('每股收益', 0)),
                    'roe': self._parse_financial_number(row.get('净资产收益率', 0)),
                    'roa': self._parse_financial_number(row.get('总资产收益率', 0)),
                    'grossMargin': self._parse_financial_number(row.get('毛利率', 0)),
                    'netMargin': self._parse_financial_number(row.get('净利率', 0)),
                    'debtRatio': self._parse_financial_number(row.get('资产负债率', 0)),
                }
                financial_list.append(financial_data)
            
            return financial_list
        except Exception as e:
            logger.error(f"解析{symbol}财务摘要失败: {e}")
            return None
    
    def _parse_profit_sheet(self, symbol, df):
        """解析利润表数据"""
        try:
            financial_list = []
            # 这里根据实际的利润表数据结构进行解析
            # 由于不同接口返回的数据结构可能不同，需要适配
            return financial_list
        except Exception as e:
            logger.error(f"解析{symbol}利润表失败: {e}")
            return None
    
    def crawl_dividend_data(self, limit=None):
        """爬取分红配股数据"""
        logger.info("开始爬取分红配股数据...")
        
        try:
            # 获取已有分红数据的股票代码
            existing_dividend_symbols = set(db_manager.execute_query(
                "SELECT DISTINCT symbol FROM stock_dividend"
            ) or [])
            existing_dividend_symbols = {row[0] for row in existing_dividend_symbols}
            
            # 获取所有股票代码
            all_symbols = db_manager.execute_query(
                "SELECT symbol FROM stock_info WHERE isActive = 1 ORDER BY symbol"
            )
            all_symbols = [row[0] for row in all_symbols] if all_symbols else []
            
            # 找出缺失分红数据的股票
            missing_symbols = [s for s in all_symbols if s not in existing_dividend_symbols]
            
            if limit:
                missing_symbols = missing_symbols[:limit]
            
            logger.info(f"需要爬取分红数据的股票: {len(missing_symbols)}只")
            
            success_count = 0
            failed_count = 0
            
            for i, symbol in enumerate(missing_symbols):
                try:
                    logger.info(f"正在爬取 {symbol} 的分红数据 ({i+1}/{len(missing_symbols)})")
                    
                    dividend_data = self._get_dividend_data(symbol)
                    if dividend_data:
                        db_manager.insert_stock_dividend(dividend_data)
                        success_count += 1
                        logger.info(f"✓ {symbol} 分红数据爬取成功，{len(dividend_data)}条记录")
                    else:
                        failed_count += 1
                        logger.warning(f"✗ {symbol} 分红数据爬取失败")
                    
                    # 分红数据请求间隔
                    delay = self.delay + random.uniform(0.5, 1.5)
                    time.sleep(delay)
                    
                except Exception as e:
                    logger.error(f"爬取{symbol}的分红数据异常: {e}")
                    failed_count += 1
                    time.sleep(self.delay * 2)
            
            logger.info(f"分红数据爬取完成: 成功{success_count}只, 失败{failed_count}只")
            return success_count, failed_count
            
        except Exception as e:
            logger.error(f"爬取分红数据失败: {e}")
            return 0, 0
    
    def _get_dividend_data(self, symbol):
        """获取分红配股数据"""
        try:
            # 获取股票名称
            stock_name = db_manager.execute_query("SELECT name FROM stock_info WHERE symbol = %s", (symbol,))
            stock_name = stock_name[0][0] if stock_name else ''
            
            dividend_list = []
            
            # 尝试多个分红数据接口
            methods = [
                ('stock_dividend_cninfo', self._try_cninfo_dividend),
                ('stock_history_dividend_detail', self._try_history_dividend),
                ('stock_dividend_detail', self._try_dividend_detail)
            ]
            
            for method_name, method_func in methods:
                try:
                    result = method_func(symbol, stock_name)
                    if result:
                        dividend_list.extend(result)
                        break
                except Exception as e:
                    logger.debug(f"{method_name}方法失败: {e}")
                    continue
            
            return dividend_list if dividend_list else None
            
        except Exception as e:
            logger.error(f"获取{symbol}分红数据失败: {e}")
            return None
    
    def _try_cninfo_dividend(self, symbol, stock_name):
        """尝试使用cninfo接口获取分红数据"""
        df = ak.stock_dividend_cninfo(symbol=symbol)
        if df.empty:
            return None
        
        dividend_list = []
        for _, row in df.iterrows():
            # 尝试多个可能的字段名
            record_date = self._get_date_field(row, ['股权登记日', '登记日', '实施方案公告日期'])
            if not record_date:
                continue  # 跳过没有记录日期的记录
            
            ex_dividend_date = self._get_date_field(row, ['除权除息日', '除息日', '除权日'])
            payment_date = self._get_date_field(row, ['派息日', '红利发放日'])
            
            # 解析分红数据
            cash_dividend = self._safe_float(row.get('每股派息', 0))
            stock_dividend = self._safe_float(row.get('每股送股', 0))
            capital_reserve = self._safe_float(row.get('每股配股', 0))
            
            # 构建分红方案描述
            dividend_plan = self._build_dividend_plan(cash_dividend, stock_dividend, capital_reserve)
            
            dividend_data = {
                'symbol': symbol,
                'name': stock_name,
                'recordDate': record_date,
                'exDividendDate': ex_dividend_date,
                'paymentDate': payment_date,
                'dividendPerShare': cash_dividend,
                'bonusShareRatio': stock_dividend,
                'rightIssueRatio': capital_reserve,
                'totalDividend': None,
                'dividendYield': None,
                'dividendPlan': dividend_plan,
                'status': '已实施'
            }
            dividend_list.append(dividend_data)
        
        return dividend_list
    
    def _try_history_dividend(self, symbol, stock_name):
        """尝试使用历史分红接口"""
        try:
            df = ak.stock_history_dividend_detail(symbol=symbol)
            if df.empty:
                return None
            
            dividend_list = []
            for _, row in df.iterrows():
                record_date = self._get_date_field(row, ['股权登记日', '登记日'])
                if not record_date:
                    continue
                
                dividend_data = {
                    'symbol': symbol,
                    'name': stock_name,
                    'recordDate': record_date,
                    'exDividendDate': self._get_date_field(row, ['除权除息日', '除息日']),
                    'paymentDate': self._get_date_field(row, ['派息日']),
                    'dividendPerShare': self._safe_float(row.get('派息', 0)),
                    'bonusShareRatio': self._safe_float(row.get('送股', 0)),
                    'rightIssueRatio': self._safe_float(row.get('配股', 0)),
                    'totalDividend': None,
                    'dividendYield': None,
                    'dividendPlan': str(row.get('分红方案', '')),
                    'status': '已实施'
                }
                dividend_list.append(dividend_data)
            
            return dividend_list
        except:
            return None
    
    def _try_dividend_detail(self, symbol, stock_name):
        """尝试使用其他分红接口"""
        try:
            # 这里可以添加其他分红数据接口
            return None
        except:
            return None
    
    def _get_date_field(self, row, field_names):
        """从多个可能的字段名中获取日期"""
        for field_name in field_names:
            value = row.get(field_name)
            if pd.notna(value) and str(value) != '' and str(value) != 'nan':
                try:
                    # 尝试转换为日期格式
                    if isinstance(value, str):
                        # 处理各种日期格式
                        date_str = str(value).strip()
                        if len(date_str) >= 8:  # 至少包含年月日
                            return date_str[:10]  # 取前10位作为日期
                    return str(value)
                except:
                    continue
        return None
    
    def _safe_float(self, value):
        """安全转换为浮点数"""
        try:
            if pd.isna(value) or value == '' or value == 'nan':
                return None
            return float(value) if float(value) != 0 else None
        except:
            return None
    
    def _build_dividend_plan(self, cash_dividend, stock_dividend, capital_reserve):
        """构建分红方案描述"""
        plan_parts = []
        
        if cash_dividend and cash_dividend > 0:
            plan_parts.append(f"每10股派{cash_dividend*10:.2f}元")
        
        if stock_dividend and stock_dividend > 0:
            plan_parts.append(f"送{stock_dividend*10:.1f}股")
        
        if capital_reserve and capital_reserve > 0:
            plan_parts.append(f"配{capital_reserve*10:.1f}股")
        
        return "".join(plan_parts) if plan_parts else "无分红"
    
    def _parse_number(self, value):
        """解析数字，处理万、亿等单位"""
        if not value or value == '-' or pd.isna(value):
            return 0
        
        try:
            value_str = str(value).replace(',', '').replace('--', '0')
            if '万' in value_str:
                return float(value_str.replace('万', '')) * 10000
            elif '亿' in value_str:
                return float(value_str.replace('亿', '')) * 100000000
            else:
                return float(value_str)
        except:
            return 0
    
    def _parse_financial_number(self, value):
        """解析财务数字"""
        if not value or pd.isna(value):
            return None
        
        try:
            if isinstance(value, str):
                # 处理百分比
                if '%' in value:
                    return float(value.replace('%', '')) / 100
                
                # 处理其他格式
                value = value.replace(',', '').replace('--', '').replace('-', '')
                if not value or value == '':
                    return None
                    
                if '万' in value:
                    return float(value.replace('万', '')) * 10000
                elif '亿' in value:
                    return float(value.replace('亿', '')) * 100000000
            
            return float(value) if value != 0 else None
        except:
            return None

def main():
    """主函数"""
    logger.info("开始增强数据爬取...")
    
    crawler = EnhancedStockCrawler()
    
    # 测试数据库连接
    if not db_manager.test_connection():
        logger.error("数据库连接失败")
        return
    
    try:
        # 1. 爬取缺失的F10数据
        logger.info("=== 爬取F10数据 ===")
        f10_success, f10_failed = crawler.crawl_missing_f10_data(limit=200)
        
        # 2. 爬取缺失的财务数据
        logger.info("=== 爬取财务数据 ===")
        fin_success, fin_failed = crawler.crawl_missing_financial_data(limit=100)
        
        # 3. 爬取分红数据
        logger.info("=== 爬取分红数据 ===")
        div_success, div_failed = crawler.crawl_dividend_data(limit=300)
        
        logger.info("=== 爬取完成 ===")
        logger.info(f"F10数据: 成功{f10_success}只, 失败{f10_failed}只")
        logger.info(f"财务数据: 成功{fin_success}只, 失败{fin_failed}只")
        logger.info(f"分红数据: 成功{div_success}只, 失败{div_failed}只")
        
    except KeyboardInterrupt:
        logger.info("用户中断程序")
    except Exception as e:
        logger.error(f"程序执行异常: {e}")

if __name__ == '__main__':
    main()