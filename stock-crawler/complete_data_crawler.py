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

class CompleteDataCrawler:
    def __init__(self):
        self.delay = Config.CRAWL_DELAY
        self.batch_size = Config.BATCH_SIZE
        self.max_retries = Config.MAX_RETRIES
    
    def crawl_all_missing_data(self, start_index=0, batch_size=50):
        """爬取所有缺失数据，按股票逐个处理"""
        logger.info("开始完整数据爬取...")
        
        try:
            # 获取所有股票代码
            all_stocks = db_manager.execute_query(
                "SELECT symbol, name FROM stock_info WHERE isActive = 1 ORDER BY symbol"
            )
            
            if not all_stocks:
                logger.error("没有找到股票数据")
                return
            
            total_stocks = len(all_stocks)
            logger.info(f"总共需要处理 {total_stocks} 只股票")
            
            # 分批处理
            end_index = min(start_index + batch_size, total_stocks)
            current_batch = all_stocks[start_index:end_index]
            
            logger.info(f"处理第 {start_index+1}-{end_index} 只股票")
            
            stats = {
                'f10_success': 0, 'f10_failed': 0,
                'financial_success': 0, 'financial_failed': 0,
                'dividend_success': 0, 'dividend_failed': 0
            }
            
            for i, (symbol, name) in enumerate(current_batch):
                logger.info(f"正在处理 {symbol} {name} ({start_index + i + 1}/{total_stocks})")
                
                # 1. 处理F10数据
                if not self._has_f10_data(symbol):
                    if self._crawl_single_f10(symbol, name):
                        stats['f10_success'] += 1
                    else:
                        stats['f10_failed'] += 1
                else:
                    logger.debug(f"{symbol} F10数据已存在")
                
                time.sleep(random.uniform(0.5, 1.0))
                
                # 2. 处理财务数据
                if not self._has_financial_data(symbol):
                    if self._crawl_single_financial(symbol, name):
                        stats['financial_success'] += 1
                    else:
                        stats['financial_failed'] += 1
                else:
                    logger.debug(f"{symbol} 财务数据已存在")
                
                time.sleep(random.uniform(1.0, 2.0))
                
                # 3. 处理分红数据
                if not self._has_dividend_data(symbol):
                    if self._crawl_single_dividend(symbol, name):
                        stats['dividend_success'] += 1
                    else:
                        stats['dividend_failed'] += 1
                else:
                    logger.debug(f"{symbol} 分红数据已存在")
                
                # 股票间延迟
                time.sleep(random.uniform(1.0, 2.0))
            
            logger.info("=== 批次处理完成 ===")
            logger.info(f"F10数据: 成功{stats['f10_success']}只, 失败{stats['f10_failed']}只")
            logger.info(f"财务数据: 成功{stats['financial_success']}只, 失败{stats['financial_failed']}只")
            logger.info(f"分红数据: 成功{stats['dividend_success']}只, 失败{stats['dividend_failed']}只")
            
            return stats
            
        except Exception as e:
            logger.error(f"完整数据爬取失败: {e}")
            return None
    
    def _has_f10_data(self, symbol):
        """检查是否已有F10数据"""
        result = db_manager.execute_query("SELECT COUNT(*) FROM stock_f10 WHERE symbol = %s", (symbol,))
        return result and result[0][0] > 0
    
    def _has_financial_data(self, symbol):
        """检查是否已有财务数据"""
        result = db_manager.execute_query("SELECT COUNT(*) FROM stock_financial WHERE symbol = %s", (symbol,))
        return result and result[0][0] > 0
    
    def _has_dividend_data(self, symbol):
        """检查是否已有分红数据"""
        result = db_manager.execute_query("SELECT COUNT(*) FROM stock_dividend WHERE symbol = %s", (symbol,))
        return result and result[0][0] > 0
    
    def _crawl_single_f10(self, symbol, name):
        """爬取单只股票的F10数据"""
        try:
            # 尝试多个F10数据接口
            f10_methods = [
                self._get_f10_from_individual_info,
                self._get_f10_from_basic_info,
                self._get_f10_from_profile
            ]
            
            for method in f10_methods:
                try:
                    f10_data = method(symbol, name)
                    if f10_data:
                        db_manager.insert_stock_f10([f10_data])
                        logger.info(f"✓ {symbol} F10数据获取成功")
                        return True
                except Exception as e:
                    logger.debug(f"F10方法失败: {e}")
                    continue
            
            logger.warning(f"✗ {symbol} F10数据获取失败")
            return False
            
        except Exception as e:
            logger.error(f"爬取{symbol} F10数据异常: {e}")
            return False
    
    def _get_f10_from_individual_info(self, symbol, name):
        """从个股信息获取F10数据"""
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
    
    def _get_f10_from_basic_info(self, symbol, name):
        """从基本信息获取F10数据"""
        try:
            # 尝试其他接口
            df = ak.stock_individual_basic_info_em(symbol=symbol)
            if df.empty:
                return None
            
            # 根据实际返回结构解析
            return {
                'symbol': symbol,
                'name': name,
                'companyName': name,
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
    
    def _get_f10_from_profile(self, symbol, name):
        """从公司概况获取F10数据"""
        try:
            # 可以尝试其他akshare接口
            return None
        except:
            return None
    
    def _crawl_single_financial(self, symbol, name):
        """爬取单只股票的财务数据"""
        try:
            # 尝试多个财务数据接口
            financial_methods = [
                self._get_financial_from_abstract,
                self._get_financial_from_report,
                self._get_financial_from_summary
            ]
            
            for method in financial_methods:
                try:
                    financial_data = method(symbol, name)
                    if financial_data:
                        db_manager.insert_stock_financial(financial_data)
                        logger.info(f"✓ {symbol} 财务数据获取成功，{len(financial_data)}条")
                        return True
                except Exception as e:
                    logger.debug(f"财务方法失败: {e}")
                    continue
            
            logger.warning(f"✗ {symbol} 财务数据获取失败")
            return False
            
        except Exception as e:
            logger.error(f"爬取{symbol}财务数据异常: {e}")
            return False
    
    def _get_financial_from_abstract(self, symbol, name):
        """从财务摘要获取数据"""
        df = ak.stock_financial_abstract_ths(symbol=symbol)
        if df.empty:
            return None
        
        financial_list = []
        for _, row in df.iterrows():
            financial_data = {
                'symbol': symbol,
                'name': name,
                'reportDate': self._parse_date(row.get('报告期')),
                'reportType': '年报',
                'revenue': self._parse_financial_value(row.get('营业收入')),
                'netProfit': self._parse_financial_value(row.get('净利润')),
                'totalAssets': self._parse_financial_value(row.get('总资产')),
                'totalLiabilities': self._parse_financial_value(row.get('总负债')),
                'shareholderEquity': self._parse_financial_value(row.get('股东权益')),
                'operatingCashFlow': self._parse_financial_value(row.get('经营现金流')),
                'eps': self._parse_financial_value(row.get('每股收益')),
                'roe': self._parse_financial_value(row.get('净资产收益率')),
                'roa': self._parse_financial_value(row.get('总资产收益率')),
                'grossMargin': self._parse_financial_value(row.get('毛利率')),
                'netMargin': self._parse_financial_value(row.get('净利率')),
                'debtRatio': self._parse_financial_value(row.get('资产负债率'))
            }
            
            # 只添加有效的财务数据
            if financial_data['reportDate']:
                financial_list.append(financial_data)
        
        return financial_list if financial_list else None
    
    def _get_financial_from_report(self, symbol, name):
        """从财务报表获取数据"""
        try:
            # 尝试利润表
            df = ak.stock_profit_sheet_by_report_em(symbol=symbol)
            if df.empty:
                return None
            
            # 根据实际结构解析
            return None
        except:
            return None
    
    def _get_financial_from_summary(self, symbol, name):
        """从财务汇总获取数据"""
        try:
            # 可以尝试其他财务接口
            return None
        except:
            return None
    
    def _crawl_single_dividend(self, symbol, name):
        """爬取单只股票的分红数据"""
        try:
            # 尝试多个分红数据接口
            dividend_methods = [
                self._get_dividend_from_cninfo,
                self._get_dividend_from_history,
                self._get_dividend_from_detail
            ]
            
            for method in dividend_methods:
                try:
                    dividend_data = method(symbol, name)
                    if dividend_data:
                        db_manager.insert_stock_dividend(dividend_data)
                        logger.info(f"✓ {symbol} 分红数据获取成功，{len(dividend_data)}条")
                        return True
                except Exception as e:
                    logger.debug(f"分红方法失败: {e}")
                    continue
            
            logger.warning(f"✗ {symbol} 分红数据获取失败")
            return False
            
        except Exception as e:
            logger.error(f"爬取{symbol}分红数据异常: {e}")
            return False
    
    def _get_dividend_from_cninfo(self, symbol, name):
        """从cninfo获取分红数据"""
        df = ak.stock_dividend_cninfo(symbol=symbol)
        if df.empty:
            return None
        
        dividend_list = []
        for _, row in df.iterrows():
            # 打印可用的列名以便调试
            available_columns = list(row.index)
            logger.debug(f"可用字段: {available_columns}")
            
            # 尝试多个可能的日期字段名
            possible_record_dates = [
                '股权登记日', '登记日', '实施方案公告日期', '公告日期', 
                '股权登记', '登记', '公告', '方案公告日期'
            ]
            
            record_date = self._get_best_date(row, possible_record_dates)
            if not record_date:
                # 如果没有找到记录日期，尝试使用公告日期作为备选
                for col in available_columns:
                    if '日期' in col or '公告' in col:
                        record_date = self._get_best_date(row, [col])
                        if record_date:
                            break
                
                if not record_date:
                    logger.debug(f"跳过{symbol}的一条分红记录，无法找到有效日期")
                    continue
            
            # 尝试多个可能的除权除息日字段名
            possible_ex_dates = [
                '除权除息日', '除息日', '除权日', '除权除息', '除息', '除权'
            ]
            
            # 尝试多个可能的派息日字段名
            possible_payment_dates = [
                '派息日', '红利发放日', '派息', '发放日', '红利发放'
            ]
            
            # 尝试多个可能的分红字段名
            possible_dividend_fields = [
                '每股派息', '派息', '现金分红', '每股分红', '分红'
            ]
            
            possible_bonus_fields = [
                '每股送股', '送股', '股票股利', '每股送'
            ]
            
            possible_rights_fields = [
                '每股配股', '配股', '配股比例', '每股配'
            ]
            
            dividend_data = {
                'symbol': symbol,
                'name': name,
                'recordDate': record_date,
                'exDividendDate': self._get_best_date(row, possible_ex_dates),
                'paymentDate': self._get_best_date(row, possible_payment_dates),
                'dividendPerShare': self._get_best_float(row, possible_dividend_fields),
                'bonusShareRatio': self._get_best_float(row, possible_bonus_fields),
                'rightIssueRatio': self._get_best_float(row, possible_rights_fields),
                'totalDividend': None,
                'dividendYield': None,
                'dividendPlan': self._build_dividend_plan_flexible(row, available_columns),
                'status': '已实施'
            }
            dividend_list.append(dividend_data)
        
        return dividend_list if dividend_list else None
    
    def _get_dividend_from_history(self, symbol, name):
        """从历史分红获取数据"""
        try:
            df = ak.stock_history_dividend_detail(symbol=symbol)
            if df.empty:
                return None
            
            dividend_list = []
            for _, row in df.iterrows():
                record_date = self._get_best_date(row, ['股权登记日', '登记日'])
                if not record_date:
                    continue
                
                dividend_data = {
                    'symbol': symbol,
                    'name': name,
                    'recordDate': record_date,
                    'exDividendDate': self._get_best_date(row, ['除权除息日']),
                    'paymentDate': self._get_best_date(row, ['派息日']),
                    'dividendPerShare': self._safe_float(row.get('派息')),
                    'bonusShareRatio': self._safe_float(row.get('送股')),
                    'rightIssueRatio': self._safe_float(row.get('配股')),
                    'totalDividend': None,
                    'dividendYield': None,
                    'dividendPlan': str(row.get('分红方案', '')),
                    'status': '已实施'
                }
                dividend_list.append(dividend_data)
            
            return dividend_list if dividend_list else None
        except:
            return None
    
    def _get_dividend_from_detail(self, symbol, name):
        """从分红详情获取数据"""
        try:
            # 可以尝试其他分红接口
            return None
        except:
            return None
    
    def _get_best_date(self, row, field_names):
        """从多个字段中获取最佳日期"""
        for field_name in field_names:
            value = row.get(field_name)
            if pd.notna(value) and str(value).strip() not in ['', 'nan', 'None']:
                date_str = str(value).strip()
                if len(date_str) >= 8:  # 至少包含年月日
                    return date_str[:10]
        return None
    
    def _safe_str(self, value, max_length):
        """安全字符串转换"""
        if not value or pd.isna(value):
            return ''
        return str(value)[:max_length]
    
    def _safe_float(self, value):
        """安全浮点数转换"""
        try:
            if pd.isna(value) or str(value).strip() in ['', 'nan', 'None', '--', '-']:
                return None
            return float(value) if float(value) != 0 else None
        except:
            return None
    
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
    
    def _parse_financial_value(self, value):
        """解析财务数值"""
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
            
            return float(value) if float(value) != 0 else None
        except:
            return None
    
    def _get_best_float(self, row, field_names):
        """从多个字段中获取最佳浮点数值"""
        for field_name in field_names:
            value = row.get(field_name)
            if pd.notna(value) and str(value).strip() not in ['', 'nan', 'None', '--', '-']:
                try:
                    return float(value) if float(value) != 0 else None
                except:
                    continue
        return None
    
    def _build_dividend_plan_flexible(self, row, available_columns):
        """灵活构建分红方案"""
        parts = []
        
        # 尝试找到现金分红字段
        cash_fields = ['每股派息', '派息', '现金分红', '每股分红', '分红']
        cash = None
        for field in cash_fields:
            if field in available_columns:
                cash = self._safe_float(row.get(field))
                if cash and cash > 0:
                    break
        
        if cash and cash > 0:
            parts.append(f"每10股派{cash*10:.2f}元")
        
        # 尝试找到送股字段
        bonus_fields = ['每股送股', '送股', '股票股利', '每股送']
        bonus = None
        for field in bonus_fields:
            if field in available_columns:
                bonus = self._safe_float(row.get(field))
                if bonus and bonus > 0:
                    break
        
        if bonus and bonus > 0:
            parts.append(f"送{bonus*10:.1f}股")
        
        # 尝试找到配股字段
        rights_fields = ['每股配股', '配股', '配股比例', '每股配']
        rights = None
        for field in rights_fields:
            if field in available_columns:
                rights = self._safe_float(row.get(field))
                if rights and rights > 0:
                    break
        
        if rights and rights > 0:
            parts.append(f"配{rights*10:.1f}股")
        
        return "".join(parts) if parts else "无分红"
    
    def _build_dividend_plan(self, row):
        """构建分红方案（兼容旧版本）"""
        parts = []
        
        cash = self._safe_float(row.get('每股派息'))
        if cash and cash > 0:
            parts.append(f"每10股派{cash*10:.2f}元")
        
        bonus = self._safe_float(row.get('每股送股'))
        if bonus and bonus > 0:
            parts.append(f"送{bonus*10:.1f}股")
        
        rights = self._safe_float(row.get('每股配股'))
        if rights and rights > 0:
            parts.append(f"配{rights*10:.1f}股")
        
        return "".join(parts) if parts else "无分红"

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='完整股票数据爬虫')
    parser.add_argument('--start', type=int, default=0, help='开始索引')
    parser.add_argument('--batch', type=int, default=50, help='批次大小')
    
    args = parser.parse_args()
    
    logger.info("开始完整数据爬取...")
    
    crawler = CompleteDataCrawler()
    
    # 测试数据库连接
    if not db_manager.test_connection():
        logger.error("数据库连接失败")
        return
    
    try:
        stats = crawler.crawl_all_missing_data(
            start_index=args.start,
            batch_size=args.batch
        )
        
        if stats:
            logger.info("=== 完整爬取任务完成 ===")
        else:
            logger.error("爬取任务失败")
        
    except KeyboardInterrupt:
        logger.info("用户中断程序")
    except Exception as e:
        logger.error(f"程序执行异常: {e}")

if __name__ == '__main__':
    main()