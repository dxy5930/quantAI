import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PythonApiClient } from '../../shared/clients/python-api.client';
import { SystemService } from './system.service';

@ApiTags('系统')
@Controller('system')
export class SystemController {
  constructor(
    private readonly pythonApiClient: PythonApiClient,
    private readonly systemService: SystemService
  ) {}

  @Get('stats')
  @ApiOperation({ summary: '获取系统统计数据' })
  async getSystemStats() {
    return this.systemService.getSystemStats();
  }

  @Get('health')
  @ApiOperation({ summary: '系统健康检查' })
  async healthCheck() {
    return {
      code: 200,
      message: 'Success',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  @Post('test-python-connection')
  @ApiOperation({ summary: '测试Python服务连接' })
  async testPythonConnection() {
    try {
      // 获取Python API客户端配置信息
      const serviceInfo = this.pythonApiClient.getServiceInfo();
      
      // 测试健康检查
      const isHealthy = await this.pythonApiClient.healthCheck();
      
      // 测试回测API
      let backtestResult = null;
      try {
        const backtestResponse = await this.pythonApiClient.runBacktest({
          strategy_id: 'system_test',
          start_date: '2025-07-16',
          end_date: '2025-07-25',
          initial_capital: 100000,
          symbols: ['000001'],
          weights: [1.0],
          rebalance_frequency: 'monthly',
          commission: 0.001,
          backtest_type: 'portfolio',
          parameters: {}
        });
        
        backtestResult = {
          success: backtestResponse.success,
          strategy_id: backtestResponse.data?.strategy_id,
          total_return: backtestResponse.data?.total_return
        };
      } catch (error) {
        backtestResult = {
          error: error.message,
          status: error.status,
          endpoint: error.endpoint
        };
      }
      
      return {
        code: 200,
        message: 'Python连接测试完成',
        data: {
          serviceInfo,
          healthCheck: isHealthy,
          backtestTest: backtestResult,
          timestamp: new Date().toISOString()
        },
        success: true,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        code: 500,
        message: 'Python连接测试失败',
        data: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('config')
  @ApiOperation({ summary: '获取系统配置信息' })
  async getConfig() {
    return {
      code: 200,
      message: 'Success',
      data: {
        nodeEnv: process.env.NODE_ENV,
        pythonServiceUrl: process.env.PYTHON_SERVICE_URL,
        pythonServiceProtocol: process.env.PYTHON_SERVICE_PROTOCOL,
        pythonServiceHost: process.env.PYTHON_SERVICE_HOST,
        pythonServicePort: process.env.PYTHON_SERVICE_PORT,
        timestamp: new Date().toISOString()
      },
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}