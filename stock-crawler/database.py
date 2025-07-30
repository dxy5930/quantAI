import pymysql
from loguru import logger
from config import Config
import pandas as pd

class DatabaseManager:
    def __init__(self):
        self.connection_config = {
            'host': Config.DB_HOST,
            'port': Config.DB_PORT,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'database': Config.DB_NAME,
            'charset': 'utf8mb4',
            'autocommit': True
        }
    
    def get_connection(self):
        """获取数据库连接"""
        return pymysql.connect(**self.connection_config)
    
    def test_connection(self):
        """测试数据库连接"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            conn.close()
            logger.info("数据库连接测试成功")
            return True
        except Exception as e:
            logger.error(f"数据库连接测试失败: {e}")
            return False
    
    def execute_query(self, query, params=None):
        """执行查询语句"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                result = cursor.fetchall()
            conn.close()
            return result
        except Exception as e:
            logger.error(f"查询执行失败: {e}")
            return None
    
    def insert_stock_info(self, stock_data):
        """插入股票基本信息"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO stock_info (
                        symbol, name, industry, sector, market, listDate,
                        marketCap, circulationMarketCap, totalShares, circulationShares,
                        peRatio, pbRatio, dividendYield, isActive, createdAt, updatedAt
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    )
                """
                
                for stock in stock_data:
                    cursor.execute(insert_query, (
                        stock['symbol'], stock['name'], stock['industry'], stock['sector'],
                        stock['market'], stock['listDate'], stock['marketCap'], 
                        stock['circulationMarketCap'], stock['totalShares'], 
                        stock['circulationShares'], stock['peRatio'], stock['pbRatio'],
                        stock['dividendYield'], stock['isActive']
                    ))
            
            conn.close()
            logger.info(f"成功插入 {len(stock_data)} 条股票基本信息")
            return True
        except Exception as e:
            logger.error(f"插入股票基本信息失败: {e}")
            return False
    
    def insert_stock_data(self, stock_data):
        """插入股票交易数据（使用ON DUPLICATE KEY UPDATE避免重复）"""
        if not stock_data:
            return True
            
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO stock_data (
                        symbol, name, date, open, high, low, close, volume, amount,
                        changePercent, changeAmount, turnoverRate, createdAt, updatedAt
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        open = VALUES(open),
                        high = VALUES(high),
                        low = VALUES(low),
                        close = VALUES(close),
                        volume = VALUES(volume),
                        amount = VALUES(amount),
                        changePercent = VALUES(changePercent),
                        changeAmount = VALUES(changeAmount),
                        turnoverRate = VALUES(turnoverRate),
                        updatedAt = NOW()
                """
                
                # 逐条插入，避免批量插入时的重复键错误
                success_count = 0
                failed_count = 0
                
                for stock in stock_data:
                    try:
                        cursor.execute(insert_query, (
                            stock['symbol'], stock['name'], stock['date'], stock['open'],
                            stock['high'], stock['low'], stock['close'], stock['volume'],
                            stock['amount'], stock['changePercent'], stock['changeAmount'],
                            stock['turnoverRate']
                        ))
                        success_count += 1
                    except Exception as e:
                        # 如果是重复键错误，记录但不中断
                        if "Duplicate entry" in str(e):
                            logger.warning(f"股票 {stock['symbol']} 日期 {stock['date']} 数据已存在，跳过")
                        else:
                            logger.error(f"插入股票 {stock['symbol']} 数据失败: {e}")
                        failed_count += 1
            
            conn.close()
            logger.info(f"股票交易数据处理完成: 成功{success_count}条, 失败{failed_count}条")
            return True
        except Exception as e:
            logger.error(f"插入股票交易数据失败: {e}")
            return False
    
    def insert_stock_f10(self, f10_data):
        """插入F10基本信息"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO stock_f10 (
                        symbol, name, fullName, industry, mainBusiness, businessScope,
                        listingDate, totalShares, circulationShares, legalRepresentative, 
                        generalManager, boardSecretary, website, officeAddress, companyProfile
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        fullName = VALUES(fullName),
                        industry = VALUES(industry),
                        mainBusiness = VALUES(mainBusiness),
                        businessScope = VALUES(businessScope),
                        listingDate = VALUES(listingDate),
                        totalShares = VALUES(totalShares),
                        circulationShares = VALUES(circulationShares),
                        legalRepresentative = VALUES(legalRepresentative),
                        generalManager = VALUES(generalManager),
                        boardSecretary = VALUES(boardSecretary),
                        website = VALUES(website),
                        officeAddress = VALUES(officeAddress),
                        companyProfile = VALUES(companyProfile),
                        updatedAt = CURRENT_TIMESTAMP
                """
                
                for f10 in f10_data:
                    cursor.execute(insert_query, (
                        f10['symbol'], f10.get('name', ''), f10.get('companyName', ''), 
                        f10.get('industry', ''), f10.get('mainBusiness', ''),
                        f10.get('businessScope', ''), f10.get('listDate', None), 
                        f10.get('totalShares', None), f10.get('circulationShares', None),
                        f10.get('chairman', ''), f10.get('generalManager', ''), 
                        f10.get('secretary', ''), f10.get('website', ''), 
                        f10.get('address', ''), f10.get('introduction', '')
                    ))
            
            conn.close()
            logger.info(f"成功插入 {len(f10_data)} 条F10基本信息")
            return True
        except Exception as e:
            logger.error(f"插入F10基本信息失败: {e}")
            return False
    
    def insert_stock_financial(self, financial_data):
        """插入财务数据"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO stock_financial (
                        symbol, name, reportDate, reportType, revenue, netProfit, 
                        totalAssets, totalLiabilities, shareholdersEquity, operatingCashFlow,
                        basicEPS, roe, roa, grossMargin, netMargin, debtToAssetRatio
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        reportType = VALUES(reportType),
                        revenue = VALUES(revenue),
                        netProfit = VALUES(netProfit),
                        totalAssets = VALUES(totalAssets),
                        totalLiabilities = VALUES(totalLiabilities),
                        shareholdersEquity = VALUES(shareholdersEquity),
                        operatingCashFlow = VALUES(operatingCashFlow),
                        basicEPS = VALUES(basicEPS),
                        roe = VALUES(roe),
                        roa = VALUES(roa),
                        grossMargin = VALUES(grossMargin),
                        netMargin = VALUES(netMargin),
                        debtToAssetRatio = VALUES(debtToAssetRatio),
                        updatedAt = CURRENT_TIMESTAMP
                """
                
                for financial in financial_data:
                    cursor.execute(insert_query, (
                        financial['symbol'], financial.get('name', ''), financial['reportDate'], 
                        financial.get('reportType', '年报'), financial.get('revenue', None),
                        financial.get('netProfit', None), financial.get('totalAssets', None), 
                        financial.get('totalLiabilities', None), financial.get('shareholderEquity', None),
                        financial.get('operatingCashFlow', None), financial.get('eps', None),
                        financial.get('roe', None), financial.get('roa', None), 
                        financial.get('grossMargin', None), financial.get('netMargin', None),
                        financial.get('debtRatio', None)
                    ))
            
            conn.close()
            logger.info(f"成功插入 {len(financial_data)} 条财务数据")
            return True
        except Exception as e:
            logger.error(f"插入财务数据失败: {e}")
            return False
    
    def insert_stock_dividend(self, dividend_data):
        """插入分红配股数据"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO stock_dividend (
                        symbol, name, recordDate, exDividendDate, paymentDate,
                        cashDividendPerShare, stockDividendPerShare, capitalReservePerShare,
                        totalDividend, dividendYield, dividendPlan, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        exDividendDate = VALUES(exDividendDate),
                        paymentDate = VALUES(paymentDate),
                        cashDividendPerShare = VALUES(cashDividendPerShare),
                        stockDividendPerShare = VALUES(stockDividendPerShare),
                        capitalReservePerShare = VALUES(capitalReservePerShare),
                        totalDividend = VALUES(totalDividend),
                        dividendYield = VALUES(dividendYield),
                        dividendPlan = VALUES(dividendPlan),
                        status = VALUES(status),
                        updatedAt = CURRENT_TIMESTAMP
                """
                
                for dividend in dividend_data:
                    cursor.execute(insert_query, (
                        dividend['symbol'], dividend.get('name', ''), dividend['recordDate'],
                        dividend.get('exDividendDate', None), dividend.get('paymentDate', None),
                        dividend.get('dividendPerShare', None), dividend.get('bonusShareRatio', None),
                        dividend.get('rightIssueRatio', None), dividend.get('totalDividend', None),
                        dividend.get('dividendYield', None), dividend.get('dividendPlan', ''),
                        dividend.get('status', '已实施')
                    ))
            
            conn.close()
            logger.info(f"成功插入 {len(dividend_data)} 条分红配股数据")
            return True
        except Exception as e:
            logger.error(f"插入分红配股数据失败: {e}")
            return False
    
    def upsert_stock_info(self, stock_data):
        """更新或插入股票基本信息"""
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                for stock in stock_data:
                    # 检查是否存在
                    check_query = "SELECT COUNT(*) FROM stock_info WHERE symbol = %s"
                    cursor.execute(check_query, (stock['symbol'],))
                    exists = cursor.fetchone()[0] > 0
                    
                    if exists:
                        # 更新
                        update_query = """
                            UPDATE stock_info SET 
                                name = %s, industry = %s, sector = %s, market = %s,
                                listDate = %s, marketCap = %s, circulationMarketCap = %s,
                                totalShares = %s, circulationShares = %s, peRatio = %s,
                                pbRatio = %s, dividendYield = %s, isActive = %s, updatedAt = NOW()
                            WHERE symbol = %s
                        """
                        cursor.execute(update_query, (
                            stock['name'], stock['industry'], stock['sector'], stock['market'],
                            stock['listDate'], stock['marketCap'], stock['circulationMarketCap'],
                            stock['totalShares'], stock['circulationShares'], stock['peRatio'],
                            stock['pbRatio'], stock['dividendYield'], stock['isActive'],
                            stock['symbol']
                        ))
                    else:
                        # 插入
                        insert_query = """
                            INSERT INTO stock_info (
                                symbol, name, industry, sector, market, listDate,
                                marketCap, circulationMarketCap, totalShares, circulationShares,
                                peRatio, pbRatio, dividendYield, isActive, createdAt, updatedAt
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                            )
                        """
                        cursor.execute(insert_query, (
                            stock['symbol'], stock['name'], stock['industry'], stock['sector'],
                            stock['market'], stock['listDate'], stock['marketCap'],
                            stock['circulationMarketCap'], stock['totalShares'], stock['circulationShares'],
                            stock['peRatio'], stock['pbRatio'], stock['dividendYield'], stock['isActive']
                        ))
            
            conn.close()
            logger.info(f"成功更新/插入 {len(stock_data)} 条股票基本信息")
            return True
        except Exception as e:
            logger.error(f"更新/插入股票基本信息失败: {e}")
            return False
    
    def get_existing_symbols(self):
        """获取数据库中已存在的股票代码"""
        try:
            query = "SELECT DISTINCT symbol FROM stock_info WHERE isActive = 1"
            result = self.execute_query(query)
            return [row[0] for row in result] if result else []
        except Exception as e:
            logger.error(f"获取已存在股票代码失败: {e}")
            return []
    
    def get_stock_count(self):
        """获取股票数量统计"""
        try:
            conn = self.get_connection()
            stats = {}
            
            with conn.cursor() as cursor:
                # 总股票数
                cursor.execute("SELECT COUNT(*) FROM stock_info WHERE isActive = 1")
                stats['total_stocks'] = cursor.fetchone()[0]
                
                # 总交易记录数
                cursor.execute("SELECT COUNT(*) FROM stock_data")
                stats['total_records'] = cursor.fetchone()[0]
                
                # 今日记录数
                cursor.execute("SELECT COUNT(*) FROM stock_data WHERE date = CURDATE()")
                stats['today_records'] = cursor.fetchone()[0]
            
            conn.close()
            return stats
        except Exception as e:
            logger.error(f"获取股票统计失败: {e}")
            return {}

# 全局数据库管理器实例
db_manager = DatabaseManager()