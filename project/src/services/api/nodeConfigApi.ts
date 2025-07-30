import { httpClient } from '../../utils/httpClient';
import { UnifiedApiResponse } from '../../types';

// 获取 API 前缀
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export interface NodeConfigOption {
  id: number;
  optionValue: string;
  optionLabel: string;
  optionDescription?: string;
  sortOrder: number;
}

export interface NodeConfigField {
  id: number;
  fieldKey: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range';
  isRequired: boolean;
  defaultValue: string;
  placeholder?: string;
  description?: string;
  sortOrder: number;
  options?: NodeConfigOption[];
}

export interface NodeTypeConfig {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  configFields: NodeConfigField[];
}

export interface NodeTemplate {
  type: string;
  name: string;
  description: string;
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export const nodeConfigApi = {
  /**
   * 获取所有节点类型及其配置
   */
  getAllNodeConfigs: async (): Promise<UnifiedApiResponse<NodeTypeConfig[]>> => {
    return httpClient.get(`${API_PREFIX}/node-config/types`);
  },

  /**
   * 获取指定节点类型的配置
   */
  getNodeConfigByType: async (nodeType: string): Promise<UnifiedApiResponse<NodeTypeConfig | null>> => {
    return httpClient.get(`${API_PREFIX}/node-config/types/${nodeType}`);
  },

  /**
   * 获取节点模板（用于拖拽创建）
   */
  getNodeTemplates: async (): Promise<UnifiedApiResponse<NodeTemplate[]>> => {
    return httpClient.get(`${API_PREFIX}/node-config/templates`);
  },
}; 