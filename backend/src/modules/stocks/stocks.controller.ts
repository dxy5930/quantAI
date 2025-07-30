import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { StocksService } from "./stocks.service";
import { AkshareService } from "./services/akshare.service";
import { StockSchedulerService } from "./services/stock-scheduler.service";
import { SelectionCriteria } from "../../shared/types";

@ApiTags("stocks")
@Controller("stocks")
export class StocksController {
  constructor(
    private stocksService: StocksService,
    private akshareService: AkshareService,
    private stockSchedulerService: StockSchedulerService,
  ) {}

  @Get("list")
  @ApiOperation({ summary: "获取股票列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockList(@Query() query: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    industry?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
  }) {
    const result = await this.stocksService.getStockList(query);
    return {
      success: true,
      data: result,
      message: '获取股票列表成功'
    };
  }

  @Post("recommendations")
  @ApiOperation({ summary: "获取股票推荐" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRecommendations(@Body() criteria?: SelectionCriteria) {
    return this.stocksService.getRecommendations(criteria);
  }

  @Post("screen")
  @ApiOperation({ summary: "股票筛选" })
  @ApiResponse({ status: 200, description: "筛选成功" })
  async screenStocks(@Body() criteria: SelectionCriteria) {
    return this.stocksService.getRecommendations(criteria);
  }

  @Post("search")
  @ApiOperation({ summary: "搜索股票" })
  @ApiResponse({ status: 200, description: "搜索成功" })
  async searchStocks(@Body() data: { q: string }) {
    const result = await this.stocksService.searchStocks(data.q);
    return {
      success: true,
      data: result,
      message: '搜索股票成功'
    };
  }

  @Post(":symbol")
  @ApiOperation({ summary: "获取股票详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockData(@Param("symbol") symbol: string) {
    return this.stocksService.getStockData(symbol);
  }

  @Post(":symbol/analysis")
  @ApiOperation({ summary: "获取股票分析数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockAnalysis(
    @Param("symbol") symbol: string,
    @Body() body: { strategyId?: string }
  ) {
    const result = await this.stocksService.getStockAnalysis(symbol, body.strategyId);
    return {
      success: true,
      data: result,
      message: '获取股票分析数据成功'
    };
  }

  @Post(":symbol/trend")
  @ApiOperation({ summary: "获取股票趋势数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockTrend(@Param("symbol") symbol: string) {
    const result = await this.stocksService.getStockTrend(symbol);
    return {
      success: true,
      data: result,
      message: '获取股票趋势数据成功'
    };
  }

  @Post("batch-trends")
  @ApiOperation({ summary: "批量获取股票趋势汇总信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getBatchStockTrends(@Body() body: { symbols: string[], period?: string }) {
    const result = await this.stocksService.getBatchStockTrends(body.symbols, body.period);
    return {
      success: true,
      data: result,
      message: '批量获取股票趋势汇总信息成功'
    };
  }

  @Post(":symbol/charts")
  @ApiOperation({ summary: "获取股票图表数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockCharts(@Param("symbol") symbol: string, @Body() data: { period?: string } = {}) {
    const period = data.period || '1y';
    const result = await this.stocksService.getStockCharts(symbol, period);
    return {
      success: true,
      data: result,
      message: '获取股票图表数据成功'
    };
  }

  @Post(":symbol/history")
  @ApiOperation({ summary: "获取股票历史数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockHistory(@Param("symbol") symbol: string, @Body() data: { 
    start_date?: string; 
    end_date?: string; 
    interval?: string 
  } = {}) {
    const result = await this.stocksService.getStockHistory(symbol, data);
    return {
      success: true,
      data: result,
      message: '获取股票历史数据成功'
    };
  }

  @Post("realtime")
  @ApiOperation({ summary: "获取股票实时数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockRealtime(@Body() data: { symbols: string }) {
    const symbols = data.symbols.split(',');
    const result = await this.stocksService.getStockRealtime(symbols);
    return {
      success: true,
      data: result,
      message: '获取股票实时数据成功'
    };
  }



  @Post("akshare/search")
  @ApiOperation({ summary: "通过akshare搜索股票" })
  @ApiResponse({ status: 200, description: "搜索成功" })
  async searchStockByAkshare(@Body() data: { keyword: string }) {
    const result = await this.akshareService.searchStock(data.keyword);
    return {
      success: true,
      data: result,
      message: '搜索股票成功'
    };
  }

  @Post("akshare/realtime")
  @ApiOperation({ summary: "通过akshare获取实时数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRealtimeByAkshare(@Body() data: { symbols: string[] }) {
    const result = await this.akshareService.getStockRealtime(data.symbols);
    return {
      success: true,
      data: result,
      message: '获取实时数据成功'
    };
  }

  @Get("akshare/industry")
  @ApiOperation({ summary: "获取行业板块数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getIndustryData() {
    const result = await this.akshareService.getIndustryData();
    return {
      success: true,
      data: result,
      message: '获取行业板块数据成功'
    };
  }

  // ========== 新增调度相关API ==========

  @Post("scheduler/manual-crawl")
  @ApiOperation({ summary: "手动触发Python爬虫执行股票数据爬取" })
  @ApiResponse({ status: 200, description: "爬取成功" })
  async manualCrawl() {
    return await this.stockSchedulerService.manualCrawl();
  }

  @Get("scheduler/status")
  @ApiOperation({ summary: "获取爬取状态和统计信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getCrawlStatus() {
    return await this.stockSchedulerService.getCrawlStatus();
  }

  // ========== F10和财务数据查询API (数据由Python爬虫提供) ==========

  @Get(":symbol/f10")
  @ApiOperation({ summary: "获取股票F10基本信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockF10(@Param("symbol") symbol: string) {
    // 这里需要添加查询F10数据的逻辑
    return {
      success: true,
      data: { symbol, message: "F10数据查询功能待实现" },
      message: '获取F10信息成功'
    };
  }

  @Get(":symbol/financial")
  @ApiOperation({ summary: "获取股票财务数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockFinancial(
    @Param("symbol") symbol: string,
    @Query("years") years: number = 3
  ) {
    // 这里需要添加查询财务数据的逻辑
    return {
      success: true,
      data: { symbol, years, message: "财务数据查询功能待实现" },
      message: '获取财务数据成功'
    };
  }

  @Get(":symbol/dividend")
  @ApiOperation({ summary: "获取股票分红配股数据" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getStockDividend(
    @Param("symbol") symbol: string,
    @Query("years") years: number = 5
  ) {
    // 这里需要添加查询分红数据的逻辑
    return {
      success: true,
      data: { symbol, years, message: "分红数据查询功能待实现" },
      message: '获取分红数据成功'
    };
  }
}
