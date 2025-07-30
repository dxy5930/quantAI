import akshare as ak
import pandas as pd
import time
from datetime import datetime, timedelta
from loguru import logger
from config import Config
from database import db_manager
import numpy as np

class StockCrawler:
    def __init__(self):
        self.delay = Config.CRAWL_DELAY
        self.batch_size = Config.BATCH_SIZE
        self.max_retries = Config.MAX_RETRIES
    
    def crawl_all_stocks(self):
        """爬取所有市场的股票数据"""
        logger.info("开始爬取所有市场股票数据")
        
        total_success = 0
        total_failed = 0
        
        # 爬取各个市场
        markets = [
            ('沪深A股', 'stock_zh_a_spot_em', {'market': 'ALL'}),
        ]
        
        for market_name, ak_func, market_info in markets:
            logger.info(f"开始爬取{market_name}数据")
            success, failed = self._crawl_market_stocks(market_name, ak_func, market_info)
            total_success += success
            total_failed += failed
            
            # 市场间延迟
            time.sleep(self.delay * 2)
        
        logger.info(f"所有市场爬取完成: 成功{total_success}只, 失败{total_failed}只")
        return total_success, total_failed
    
    def _crawl_market_stocks(self, market_name, ak_func, market_info):
        """爬取指定市场的股票数据"""
        success_count = 0
        failed_count = 0
        
        try:
            # 获取股票列表
            logger.info(f"正在获取{market_name}股票列表...")
            df = ak.stock_zh_a_spot_em()
            
            if df.empty:
                logger.warning(f"{market_name}没有获取到数据")
                return 0, 0
            
            logger.info(f"{market_name}获取到{len(df)}只股票")
            
            # 处理股票数据
            stock_info_list = []
            stock_data_list = []
            
            for _, row in df.iterrows():
                try:
                    stock_info, stock_data = self._process_stock_row(row, market_info)
                    if stock_info and stock_data:
                        stock_info_list.append(stock_info)
                        stock_data_list.append(stock_data)
                        success_count += 1
                    else:
                        failed_count += 1
                except Exception as e:
                    logger.error(f"处理股票数据失败: {e}")
                    failed_count += 1
            
            # 批量保存数据
            if stock_info_list:
                self._save_batch_data(stock_info_list, stock_data_list)
            
        except Exception as e:
            logger.error(f"爬取{market_name}失败: {e}")
            failed_count += len(df) if 'df' in locals() else 0
        
        return success_count, failed_count
    
    def _process_stock_row(self, row, market_info):
        """处理单只股票数据"""
        try:
            # 获取基本信息
            symbol = str(row.get('代码', ''))
            name = str(row.get('名称', ''))
            
            if not symbol or not name:
                return None, None
            
            # 股票基本信息
            stock_info = {
                'symbol': symbol,
                'name': name,
                'industry': str(row.get('所属行业', '未知')),
                'sector': market_info.get('sector', self._get_sector_by_symbol(symbol)),
                'market': market_info['market'],
                'listDate': '2000-01-01',  # 默认上市日期，后续可以通过其他接口获取
                'marketCap': float(row.get('总市值', 0)) if pd.notna(row.get('总市值')) else 0,
                'circulationMarketCap': float(row.get('流通市值', 0)) if pd.notna(row.get('流通市值')) else 0,
                'totalShares': float(row.get('总股本', 0)) if pd.notna(row.get('总股本')) else 0,
                'circulationShares': float(row.get('流通股', 0)) if pd.notna(row.get('流通股')) else 0,
                'peRatio': float(row.get('市盈率-动态', 0)) if pd.notna(row.get('市盈率-动态')) else 0,
                'pbRatio': float(row.get('市净率', 0)) if pd.notna(row.get('市净率')) else 0,
                'dividendYield': 0,  # 股息率，后续通过分红数据计算
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
    
    def _save_batch_data(self, stock_info_list, stock_data_list):
        """批量保存数据"""
        try:
            # 分批保存，避免一次性插入过多数据
            batch_size = self.batch_size
            
            for i in range(0, len(stock_info_list), batch_size):
                info_batch = stock_info_list[i:i + batch_size]
                data_batch = stock_data_list[i:i + batch_size]
                
                # 保存股票基本信息（使用upsert）
                db_manager.upsert_stock_info(info_batch)
                
                # 保存交易数据
                db_manager.insert_stock_data(data_batch)
                
                time.sleep(0.1)  # 批次间短暂延迟
                
        except Exception as e:
            logger.error(f"批量保存数据失败: {e}")
    
    def crawl_historical_data(self, symbol, period='daily', start_date=None, end_date=None):
        """爬取历史数据"""
        try:
            if not start_date:
                start_date = (datetime.now() - timedelta(days=365)).strftime('%Y%m%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y%m%d')
            
            # 获取历史数据
            df = ak.stock_zh_a_hist(symbol=symbol, period=period, start_date=start_date, end_date=end_date)
            
            if df.empty:
                logger.warning(f"股票{symbol}没有历史数据")
                return False
            
            # 处理历史数据
            historical_data = []
            for _, row in df.iterrows():
                data = {
                    'symbol': symbol,
                    'name': '',  # 历史数据中没有名称，需要从股票信息中获取
                    'date': row['日期'].strftime('%Y-%m-%d'),
                    'open': float(row['开盘']),
                    'high': float(row['最高']),
                    'low': float(row['最低']),
                    'close': float(row['收盘']),
                    'volume': int(row['成交量']),
                    'amount': float(row['成交额']),
                    'changePercent': float(row.get('涨跌幅', 0)),
                    'changeAmount': float(row.get('涨跌额', 0)),
                    'turnoverRate': float(row.get('换手率', 0)),
                }
                historical_data.append(data)
            
            # 保存历史数据
            if historical_data:
                db_manager.insert_stock_data(historical_data)
                logger.info(f"成功保存股票{symbol}的{len(historical_data)}条历史数据")
                return True
            
        except Exception as e:
            logger.error(f"爬取股票{symbol}历史数据失败: {e}")
            return False
    
    def crawl_f10_data(self, symbols=None):
        """爬取F10基本信息"""
        logger.info("开始爬取F10基本信息")
        
        if not symbols:
            symbols = db_manager.get_existing_symbols()
        
        success_count = 0
        failed_count = 0
        
        for symbol in symbols:
            try:
                # 获取公司基本信息
                company_info = self._get_company_info(symbol)
                if company_info:
                    db_manager.insert_stock_f10([company_info])
                    success_count += 1
                else:
                    failed_count += 1
                
                time.sleep(self.delay)
                
            except Exception as e:
                logger.error(f"爬取股票{symbol}的F10信息失败: {e}")
                failed_count += 1
        
        logger.info(f"F10信息爬取完成: 成功{success_count}只, 失败{failed_count}只")
        return success_count, failed_count
    
    def _get_company_info(self, symbol):
        """获取公司基本信息"""
        try:
            # 获取公司信息
            df = ak.stock_individual_info_em(symbol=symbol)
            
            if df.empty:
                return None
            
            # 转换为字典格式
            info_dict = dict(zip(df['item'], df['value']))
            
            company_info = {
                'symbol': symbol,
                'companyName': info_dict.get('公司名称', ''),
                'industry': info_dict.get('所属行业', ''),
                'mainBusiness': info_dict.get('主营业务', ''),
                'businessScope': info_dict.get('经营范围', ''),
                'listDate': info_dict.get('上市时间', ''),
                'totalShares': self._parse_number(info_dict.get('总股本', 0)),
                'circulationShares': self._parse_number(info_dict.get('流通股', 0)),
                'chairman': info_dict.get('董事长', ''),
                'generalManager': info_dict.get('总经理', ''),
                'secretary': info_dict.get('董秘', ''),
                'employees': self._parse_number(info_dict.get('员工人数', 0)),
                'website': info_dict.get('公司网址', ''),
                'address': info_dict.get('办公地址', ''),
                'introduction': info_dict.get('公司简介', ''),
            }
            
            return company_info
            
        except Exception as e:
            logger.error(f"获取股票{symbol}公司信息失败: {e}")
            return None
    
    def _parse_number(self, value):
        """解析数字，处理万、亿等单位"""
        if not value or value == '-':
            return 0
        
        try:
            value_str = str(value).replace(',', '')
            if '万' in value_str:
                return float(value_str.replace('万', '')) * 10000
            elif '亿' in value_str:
                return float(value_str.replace('亿', '')) * 100000000
            else:
                return float(value_str)
        except:
            return 0
    
    def crawl_financial_data(self, symbols=None):
        """爬取财务数据"""
        logger.info("开始爬取财务数据")
        
        if not symbols:
            symbols = db_manager.get_existing_symbols()[:100]  # 限制数量，避免请求过多
        
        success_count = 0
        failed_count = 0
        
        for symbol in symbols:
            try:
                financial_data = self._get_financial_data(symbol)
                if financial_data:
                    db_manager.insert_stock_financial(financial_data)
                    success_count += 1
                else:
                    failed_count += 1
                
                time.sleep(self.delay * 2)  # 财务数据请求间隔更长
                
            except Exception as e:
                logger.error(f"爬取股票{symbol}财务数据失败: {e}")
                failed_count += 1
        
        logger.info(f"财务数据爬取完成: 成功{success_count}只, 失败{failed_count}只")
        return success_count, failed_count
    
    def _get_financial_data(self, symbol):
        """获取财务数据"""
        try:
            # 获取财务指标
            df = ak.stock_financial_abstract_ths(symbol=symbol)
            
            if df.empty:
                return None
            
            financial_list = []
            for _, row in df.iterrows():
                financial_data = {
                    'symbol': symbol,
                    'reportDate': row.get('报告期', ''),
                    'revenue': self._parse_financial_number(row.get('营业收入', 0)),
                    'netProfit': self._parse_financial_number(row.get('净利润', 0)),
                    'totalAssets': self._parse_financial_number(row.get('总资产', 0)),
                    'totalLiabilities': self._parse_financial_number(row.get('总负债', 0)),
                    'shareholderEquity': self._parse_financial_number(row.get('股东权益', 0)),
                    'operatingCashFlow': self._parse_financial_number(row.get('经营现金流', 0)),
                    'eps': float(row.get('每股收益', 0)) if pd.notna(row.get('每股收益')) else 0,
                    'roe': float(row.get('净资产收益率', 0)) if pd.notna(row.get('净资产收益率')) else 0,
                    'roa': float(row.get('总资产收益率', 0)) if pd.notna(row.get('总资产收益率')) else 0,
                    'grossMargin': float(row.get('毛利率', 0)) if pd.notna(row.get('毛利率')) else 0,
                    'netMargin': float(row.get('净利率', 0)) if pd.notna(row.get('净利率')) else 0,
                    'debtRatio': float(row.get('资产负债率', 0)) if pd.notna(row.get('资产负债率')) else 0,
                }
                financial_list.append(financial_data)
            
            return financial_list
            
        except Exception as e:
            logger.error(f"获取股票{symbol}财务数据失败: {e}")
            return None
    
    def _parse_financial_number(self, value):
        """解析财务数字"""
        if not value or pd.isna(value):
            return 0
        
        try:
            if isinstance(value, str):
                value = value.replace(',', '').replace('--', '0')
                if '万' in value:
                    return float(value.replace('万', '')) * 10000
                elif '亿' in value:
                    return float(value.replace('亿', '')) * 100000000
            
            return float(value)
        except:
            return 0

# 全局爬虫实例
crawler = StockCrawler()