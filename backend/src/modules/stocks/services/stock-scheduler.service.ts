import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StockData } from "../entities/stock-data.entity";
import { StockInfo } from "../entities/stock-info.entity";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

@Injectable()
export class StockSchedulerService {
  private readonly logger = new Logger(StockSchedulerService.name);

  constructor(
    @InjectRepository(StockData)
    private stockDataRepository: Repository<StockData>,
    @InjectRepository(StockInfo)
    private stockInfoRepository: Repository<StockInfo>
  ) {}

  /**
   * 每天早上9点触发Python爬虫执行完整股票数据爬取
   * 临时禁用定时任务，避免重复键错误
   */
  @Cron("0 0 9 * * *", {
    name: "daily-python-crawl",
    timeZone: "Asia/Shanghai",
  })
  async scheduledPythonCrawl(): Promise<void> {
    this.logger.log("开始触发Python爬虫执行每日股票数据爬取任务...");

    try {
      const result = await this.triggerPythonCrawler();
      this.logger.log(`Python爬虫执行完成: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error("Python爬虫执行失败:", error.message);
    }
  }

  /**
   * 手动触发Python爬虫
   */
  async manualCrawl(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    this.logger.log("手动触发Python爬虫执行股票数据爬取...");
    return await this.triggerPythonCrawler();
  }

  /**
   * 触发Python爬虫执行
   */
  private async triggerPythonCrawler(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const pythonPath = process.platform === "win32" ? "python" : "python3";
      const crawlerPath = "../stock-crawler/main.py";

      this.logger.log(`执行Python爬虫: ${pythonPath} ${crawlerPath}`);

      const { stdout, stderr } = await execAsync(
        `${pythonPath} ${crawlerPath}`,
        {
          cwd: process.cwd(),
        }
      );

      if (stderr) {
        this.logger.warn(`Python爬虫警告: ${stderr}`);
      }

      this.logger.log(`Python爬虫输出: ${stdout}`);

      return {
        success: true,
        message: "Python爬虫执行成功",
        data: {
          output: stdout,
          warnings: stderr || null,
        },
      };
    } catch (error) {
      const message = `Python爬虫执行失败: ${error.message}`;
      this.logger.error(message);
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * 获取爬取状态
   */
  async getCrawlStatus(): Promise<any> {
    try {
      const stats = await this.getStockStats();
      const today = new Date().toISOString().split("T")[0];

      const [todayCount] = await this.stockDataRepository.query(
        "SELECT COUNT(*) as count FROM stock_data WHERE date = ?",
        [today]
      );

      return {
        success: true,
        data: {
          ...stats,
          todayRecords: todayCount[0].count,
          lastUpdate: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取股票统计信息
   */
  private async getStockStats(): Promise<any> {
    try {
      const [infoCount] = await this.stockInfoRepository.query(
        "SELECT COUNT(*) as count FROM stock_info"
      );
      const [dataCount] = await this.stockDataRepository.query(
        "SELECT COUNT(*) as count FROM stock_data"
      );

      const [marketStats] = await this.stockInfoRepository.query(`
        SELECT market, sector, COUNT(*) as count, 
               AVG(marketCap) as avgMarketCap,
               SUM(marketCap) as totalMarketCap
        FROM stock_info 
        WHERE marketCap > 0
        GROUP BY market, sector
        ORDER BY market, count DESC
      `);

      return {
        totalStocks: infoCount[0].count,
        totalRecords: dataCount[0].count,
        marketStats,
      };
    } catch (error) {
      this.logger.error("获取统计信息失败:", error.message);
      return null;
    }
  }
}
