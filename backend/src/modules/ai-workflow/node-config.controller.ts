import { Controller, Get, Param } from '@nestjs/common';
import { NodeConfigService, NodeTypeConfigDto } from './services/node-config.service';
import { ApiController } from '../../shared/decorators/api-prefix.decorator';

@ApiController('node-config', '节点配置')
export class NodeConfigController {
  constructor(private readonly nodeConfigService: NodeConfigService) {}

  /**
   * 获取所有节点类型及其配置
   */
  @Get('types')
  async getAllNodeConfigs(): Promise<{
    success: boolean;
    data: NodeTypeConfigDto[];
    message?: string;
  }> {
    try {
      const configs = await this.nodeConfigService.getAllNodeConfigs();
      return {
        success: true,
        data: configs,
      };
    } catch (error) {
      console.error('获取节点配置失败:', error);
      return {
        success: false,
        data: [],
        message: '获取节点配置失败',
      };
    }
  }

  /**
   * 获取指定节点类型的配置
   */
  @Get('types/:nodeType')
  async getNodeConfigByType(@Param('nodeType') nodeType: string): Promise<{
    success: boolean;
    data: NodeTypeConfigDto | null;
    message?: string;
  }> {
    try {
      const config = await this.nodeConfigService.getNodeConfigByType(nodeType);
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error('获取节点配置失败:', error);
      return {
        success: false,
        data: null,
        message: '获取节点配置失败',
      };
    }
  }

  /**
   * 获取节点模板（用于拖拽创建）
   */
  @Get('templates')
  async getNodeTemplates(): Promise<{
    success: boolean;
    data: any[];
    message?: string;
  }> {
    try {
      const templates = await this.nodeConfigService.getNodeTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      console.error('获取节点模板失败:', error);
      return {
        success: false,
        data: [],
        message: '获取节点模板失败',
      };
    }
  }
} 