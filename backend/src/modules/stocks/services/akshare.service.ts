import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AkshareService {
  private readonly logger = new Logger(AkshareService.name);
  private readonly baseUrl = 'https://akshare.akfamily.xyz'; // akshare API服务地址

  /**
   * 获取A股股票列表
   */
  async getStockList(): Promise<any[]> {
    try {
      // 使用东方财富的股票列表接口
      const response = await axios.get('http://82.push2.eastmoney.com/api/qt/clist/get', {
        params: {
          pn: 1,
          pz: 5000,
          po: 1,
          np: 1,
          ut: 'bd1d9ddb04089700cf9c27f6f7426281',
          fltt: 2,
          invt: 2,
          fid: 'f3',
          fs: 'm:0 t:6,m:0 t:80,m:1 t:2,m:1 t:23',
          fields: 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152'
        },
        timeout: 300000 // 5分钟超时
      });

      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map((item: any) => ({
          symbol: item.f12,
          name: item.f14,
          price: item.f2,
          changePercent: item.f3,
          changeAmount: item.f4,
          volume: item.f5,
          amount: item.f6,
          high: item.f15,
          low: item.f16,
          open: item.f17,
          close: item.f18,
          marketCap: item.f20,
          circulationMarketCap: item.f21,
          peRatio: item.f9,
          pbRatio: item.f23,
          turnoverRate: item.f8
        }));
      }
      return [];
    } catch (error) {
      this.logger.error('获取股票列表失败:', error.message);
      return [];
    }
  }

  /**
   * 获取股票历史数据
   */
  async getStockHistory(symbol: string, period: string = 'daily', adjustType: string = 'qfq'): Promise<any[]> {
    try {
      // 使用新浪财经接口获取历史数据
      const response = await axios.get(`https://quotes.sina.cn/cn/api/jsonp_v2.php/var%20_${symbol}_${period}_${Date.now()}=/CN_MarketDataService.getKLineData`, {
        params: {
          symbol: symbol.startsWith('sh') || symbol.startsWith('sz') ? symbol : `sh${symbol}`,
          scale: period === 'daily' ? 240 : 60,
          ma: 'no',
          datalen: 1023
        },
        timeout: 300000 // 5分钟超时
      });

      if (response.data) {
        // 解析JSONP响应
        const jsonpData = response.data;
        const jsonMatch = jsonpData.match(/\[(.*)\]/);
        if (jsonMatch) {
          const data = JSON.parse(`[${jsonMatch[1]}]`);
          return data.map((item: any) => ({
            date: item.day,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume)
          }));
        }
      }
      return [];
    } catch (error) {
      this.logger.error(`获取股票${symbol}历史数据失败:`, error.message);
      return [];
    }
  }

  /**
   * 获取股票实时数据
   */
  async getStockRealtime(symbols: string[]): Promise<any[]> {
    try {
      const symbolsStr = symbols.map(s => 
        s.startsWith('sh') || s.startsWith('sz') ? s : `sh${s}`
      ).join(',');
      
      const response = await axios.get(`https://hq.sinajs.cn/list=${symbolsStr}`, {
        timeout: 10000
      });

      if (response.data) {
        const lines = response.data.split('\n').filter((line: string) => line.trim());
        return lines.map((line: string) => {
          const match = line.match(/var hq_str_(.+?)="(.+?)";/);
          if (match) {
            const symbol = match[1];
            const data = match[2].split(',');
            if (data.length >= 32) {
              return {
                symbol: symbol.replace(/^(sh|sz)/, ''),
                name: data[0],
                open: parseFloat(data[1]),
                close: parseFloat(data[2]),
                price: parseFloat(data[3]),
                high: parseFloat(data[4]),
                low: parseFloat(data[5]),
                volume: parseInt(data[8]),
                amount: parseFloat(data[9]),
                date: data[30],
                time: data[31]
              };
            }
          }
          return null;
        }).filter(item => item !== null);
      }
      return [];
    } catch (error) {
      this.logger.error('获取股票实时数据失败:', error.message);
      return [];
    }
  }

  /**
   * 获取股票基本信息
   */
  async getStockInfo(symbol: string): Promise<any> {
    try {
      // 使用腾讯财经接口获取股票基本信息
      const response = await axios.get(`https://qt.gtimg.cn/q=${symbol}`, {
        timeout: 10000
      });

      if (response.data) {
        const data = response.data.split('~');
        if (data.length > 40) {
          return {
            symbol: data[2],
            name: data[1],
            price: parseFloat(data[3]),
            changeAmount: parseFloat(data[4]),
            changePercent: parseFloat(data[5]),
            volume: parseInt(data[6]),
            amount: parseFloat(data[37]),
            high: parseFloat(data[33]),
            low: parseFloat(data[34]),
            open: parseFloat(data[5]),
            close: parseFloat(data[4]),
            marketCap: parseFloat(data[45]),
            peRatio: parseFloat(data[39]),
            pbRatio: parseFloat(data[46]),
            turnoverRate: parseFloat(data[38])
          };
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`获取股票${symbol}基本信息失败:`, error.message);
      return null;
    }
  }

  /**
   * 获取行业板块信息
   */
  async getIndustryData(): Promise<any[]> {
    try {
      const response = await axios.get('http://82.push2.eastmoney.com/api/qt/clist/get', {
        params: {
          pn: 1,
          pz: 200,
          po: 1,
          np: 1,
          ut: 'bd1d9ddb04089700cf9c27f6f7426281',
          fltt: 2,
          invt: 2,
          fid: 'f3',
          fs: 'm:90 t:2',
          fields: 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f62,f128,f136,f115,f152'
        },
        timeout: 120000 // 2分钟超时
      });

      if (response.data && response.data.data && response.data.data.diff) {
        return response.data.data.diff.map((item: any) => ({
          code: item.f12,
          name: item.f14,
          changePercent: item.f3,
          changeAmount: item.f4,
          price: item.f2,
          volume: item.f5,
          amount: item.f6
        }));
      }
      return [];
    } catch (error) {
      this.logger.error('获取行业板块数据失败:', error.message);
      return [];
    }
  }

  /**
   * 搜索股票
   */
  async searchStock(keyword: string): Promise<any[]> {
    try {
      const response = await axios.get('http://suggest3.sinajs.cn/suggest/type=11,12,13,14,15', {
        params: {
          key: keyword,
          name: 'suggestdata'
        },
        timeout: 10000
      });

      if (response.data) {
        const match = response.data.match(/suggestdata="(.+?)"/);
        if (match) {
          const data = match[1];
          const items = data.split(';').filter((item: string) => item.trim());
          return items.map((item: string) => {
            const parts = item.split(',');
            if (parts.length >= 6) {
              return {
                symbol: parts[3],
                name: parts[4],
                type: parts[0],
                market: parts[1]
              };
            }
            return null;
          }).filter(item => item !== null);
        }
      }
      return [];
    } catch (error) {
      this.logger.error(`搜索股票${keyword}失败:`, error.message);
      return [];
    }
  }
}