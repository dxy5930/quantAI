import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeType } from '../../../shared/entities/node-type.entity';
import { NodeConfigField } from '../../../shared/entities/node-config-field.entity';
import { NodeConfigOption } from '../../../shared/entities/node-config-option.entity';

export interface NodeConfigFieldDto {
  id: number;
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: string;
  placeholder: string;
  description: string;
  sortOrder: number;
  options?: NodeConfigOptionDto[];
}

export interface NodeConfigOptionDto {
  id: number;
  optionValue: string;
  optionLabel: string;
  optionDescription: string;
  sortOrder: number;
}

export interface NodeTypeConfigDto {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  configFields: NodeConfigFieldDto[];
}

@Injectable()
export class NodeConfigService {
  constructor(
    @InjectRepository(NodeType)
    private nodeTypeRepository: Repository<NodeType>,
    @InjectRepository(NodeConfigField)
    private nodeConfigFieldRepository: Repository<NodeConfigField>,
    @InjectRepository(NodeConfigOption)
    private nodeConfigOptionRepository: Repository<NodeConfigOption>,
  ) {}

  /**
   * 获取所有节点类型及其配置
   */
  async getAllNodeConfigs(): Promise<NodeTypeConfigDto[]> {
    const nodeTypes = await this.nodeTypeRepository.find({
      relations: ['configFields', 'configFields.options'],
      order: {
        configFields: {
          sortOrder: 'ASC',
          options: {
            sortOrder: 'ASC',
          },
        },
      },
    });

    return nodeTypes.map(nodeType => ({
      type: nodeType.type,
      name: nodeType.name,
      description: nodeType.description,
      icon: nodeType.icon,
      color: nodeType.color,
      configFields: nodeType.configFields
        .filter(field => field.options.every(option => option.isActive))
        .map(field => ({
          id: field.id,
          fieldKey: field.fieldKey,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          defaultValue: field.defaultValue,
          placeholder: field.placeholder,
          description: field.description,
          sortOrder: field.sortOrder,
          options: field.options
            .filter(option => option.isActive)
            .map(option => ({
              id: option.id,
              optionValue: option.optionValue,
              optionLabel: option.optionLabel,
              optionDescription: option.optionDescription,
              sortOrder: option.sortOrder,
            })),
        })),
    }));
  }

  /**
   * 获取指定节点类型的配置
   */
  async getNodeConfigByType(nodeType: string): Promise<NodeTypeConfigDto | null> {
    const nodeTypeEntity = await this.nodeTypeRepository.findOne({
      where: { type: nodeType },
      relations: ['configFields', 'configFields.options'],
      order: {
        configFields: {
          sortOrder: 'ASC',
          options: {
            sortOrder: 'ASC',
          },
        },
      },
    });

    if (!nodeTypeEntity) {
      return null;
    }

    return {
      type: nodeTypeEntity.type,
      name: nodeTypeEntity.name,
      description: nodeTypeEntity.description,
      icon: nodeTypeEntity.icon,
      color: nodeTypeEntity.color,
      configFields: nodeTypeEntity.configFields.map(field => ({
        id: field.id,
        fieldKey: field.fieldKey,
        fieldName: field.fieldName,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        defaultValue: field.defaultValue,
        placeholder: field.placeholder,
        description: field.description,
        sortOrder: field.sortOrder,
        options: field.options
          .filter(option => option.isActive)
          .map(option => ({
            id: option.id,
            optionValue: option.optionValue,
            optionLabel: option.optionLabel,
            optionDescription: option.optionDescription,
            sortOrder: option.sortOrder,
          })),
      })),
    };
  }

  /**
   * 获取节点模板（用于拖拽创建）
   */
  async getNodeTemplates(): Promise<any[]> {
    const nodeTypes = await this.nodeTypeRepository.find({
      relations: ['configFields'],
      order: {
        configFields: {
          sortOrder: 'ASC',
        },
      },
    });

    return nodeTypes.map(nodeType => {
      // 构建默认配置
      const defaultConfig: Record<string, any> = {};
      nodeType.configFields.forEach(field => {
        if (field.defaultValue) {
          try {
            // 尝试解析JSON格式的默认值
            defaultConfig[field.fieldKey] = JSON.parse(field.defaultValue);
          } catch {
            // 如果不是JSON格式，直接使用字符串
            defaultConfig[field.fieldKey] = field.defaultValue;
          }
        }
      });

      return {
        type: nodeType.type,
        name: nodeType.name,
        description: nodeType.description,
        config: defaultConfig,
        inputs: this.getDefaultInputs(nodeType.type),
        outputs: this.getDefaultOutputs(nodeType.type),
      };
    });
  }

  /**
   * 获取默认输入端口
   */
  private getDefaultInputs(nodeType: string): string[] {
    const inputsMap: Record<string, string[]> = {
      data: [],
      analysis: ['raw_data'],
      strategy: ['technical_signals', 'fundamental_scores'],
      risk: ['strategy_signals'],
      output: ['risk_assessment'],
      custom: ['input'],
    };
    return inputsMap[nodeType] || [];
  }

  /**
   * 获取默认输出端口
   */
  private getDefaultOutputs(nodeType: string): string[] {
    const outputsMap: Record<string, string[]> = {
      data: ['raw_data'],
      analysis: ['technical_signals', 'fundamental_scores'],
      strategy: ['strategy_signals'],
      risk: ['risk_assessment'],
      output: ['final_report'],
      custom: ['output'],
    };
    return outputsMap[nodeType] || [];
  }
} 