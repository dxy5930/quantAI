import React from 'react';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3, 
  Zap,
  Download,
  Eye
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  nodes: any[];
  connections: any[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'momentum_strategy',
    name: '动量策略工作流',
    description: '基于技术指标的动量投资策略，适合短期交易',
    category: '技术分析',
    icon: TrendingUp,
    tags: ['动量', '技术分析', '短期'],
    difficulty: 'beginner',
    nodes: [
      {
        id: 'data_collector',
        type: 'data',
        name: '数据收集',
        position: { x: 100, y: 100 },
        config: {
          dataSources: ['stock_price', 'volume'],
          timeRange: '6m',
          symbols: []
        }
      },
      {
        id: 'technical_analyzer',
        type: 'analysis',
        name: '技术分析',
        position: { x: 400, y: 100 },
        config: {
          indicators: ['RSI', 'MACD', 'MA'],
          period: 14
        }
      },
      {
        id: 'momentum_strategy',
        type: 'strategy',
        name: '动量策略',
        position: { x: 700, y: 100 },
        config: {
          strategyType: 'momentum',
          riskLevel: 'medium'
        }
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceId: 'data_collector',
        targetId: 'technical_analyzer',
        sourcePort: 'raw_data',
        targetPort: 'raw_data'
      },
      {
        id: 'conn2',
        sourceId: 'technical_analyzer',
        targetId: 'momentum_strategy',
        sourcePort: 'technical_signals',
        targetPort: 'technical_signals'
      }
    ]
  },
  {
    id: 'value_investing',
    name: '价值投资工作流',
    description: '基于基本面分析的价值投资策略，适合长期持有',
    category: '基本面分析',
    icon: Target,
    tags: ['价值投资', '基本面', '长期'],
    difficulty: 'intermediate',
    nodes: [
      {
        id: 'data_collector',
        type: 'data',
        name: '数据收集',
        position: { x: 100, y: 100 },
        config: {
          dataSources: ['financial_data', 'stock_price'],
          timeRange: '3y'
        }
      },
      {
        id: 'fundamental_analyzer',
        type: 'analysis',
        name: '基本面分析',
        position: { x: 400, y: 100 },
        config: {
          metrics: ['PE', 'PB', 'ROE', 'ROA'],
          benchmarks: 'industry'
        }
      },
      {
        id: 'value_strategy',
        type: 'strategy',
        name: '价值策略',
        position: { x: 700, y: 100 },
        config: {
          strategyType: 'value',
          timeHorizon: 'long_term'
        }
      },
      {
        id: 'risk_assessor',
        type: 'risk',
        name: '风险评估',
        position: { x: 1000, y: 100 },
        config: {
          riskMetrics: ['VaR', 'Sharpe'],
          backtestPeriod: '5y'
        }
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceId: 'data_collector',
        targetId: 'fundamental_analyzer',
        sourcePort: 'raw_data',
        targetPort: 'raw_data'
      },
      {
        id: 'conn2',
        sourceId: 'fundamental_analyzer',
        targetId: 'value_strategy',
        sourcePort: 'fundamental_scores',
        targetPort: 'fundamental_scores'
      },
      {
        id: 'conn3',
        sourceId: 'value_strategy',
        targetId: 'risk_assessor',
        sourcePort: 'strategy_signals',
        targetPort: 'strategy_signals'
      }
    ]
  },
  {
    id: 'risk_parity',
    name: '风险平价工作流',
    description: '基于风险平价的资产配置策略，注重风险分散',
    category: '风险管理',
    icon: Shield,
    tags: ['风险平价', '资产配置', '分散投资'],
    difficulty: 'advanced',
    nodes: [
      {
        id: 'multi_asset_data',
        type: 'data',
        name: '多资产数据',
        position: { x: 100, y: 100 },
        config: {
          dataSources: ['stock_price', 'bond_price', 'commodity_price'],
          timeRange: '2y'
        }
      },
      {
        id: 'correlation_analyzer',
        type: 'analysis',
        name: '相关性分析',
        position: { x: 400, y: 50 },
        config: {
          correlationWindow: 252,
          method: 'pearson'
        }
      },
      {
        id: 'volatility_analyzer',
        type: 'analysis',
        name: '波动率分析',
        position: { x: 400, y: 150 },
        config: {
          volatilityWindow: 60,
          method: 'ewm'
        }
      },
      {
        id: 'risk_parity_optimizer',
        type: 'strategy',
        name: '风险平价优化',
        position: { x: 700, y: 100 },
        config: {
          strategyType: 'risk_parity',
          rebalanceFreq: 'monthly'
        }
      }
    ],
    connections: [
      {
        id: 'conn1',
        sourceId: 'multi_asset_data',
        targetId: 'correlation_analyzer',
        sourcePort: 'raw_data',
        targetPort: 'raw_data'
      },
      {
        id: 'conn2',
        sourceId: 'multi_asset_data',
        targetId: 'volatility_analyzer',
        sourcePort: 'raw_data',
        targetPort: 'raw_data'
      },
      {
        id: 'conn3',
        sourceId: 'correlation_analyzer',
        targetId: 'risk_parity_optimizer',
        sourcePort: 'correlation_matrix',
        targetPort: 'correlation_data'
      },
      {
        id: 'conn4',
        sourceId: 'volatility_analyzer',
        targetId: 'risk_parity_optimizer',
        sourcePort: 'volatility_data',
        targetPort: 'volatility_data'
      }
    ]
  }
];

interface WorkflowTemplatesProps {
  onTemplateSelect: (template: WorkflowTemplate) => void;
  onClose: () => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  onTemplateSelect,
  onClose
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '初级';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return '未知';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                工作流模板库
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                选择一个模板快速开始构建你的投资策略工作流
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WORKFLOW_TEMPLATES.map((template) => {
              const IconComponent = template.icon;
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onTemplateSelect(template)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.category}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${getDifficultyColor(template.difficulty)}`}>
                      {getDifficultyText(template.difficulty)}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{template.nodes.length} 个节点</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 预览功能
                        }}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                        <span>预览</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTemplateSelect(template);
                        }}
                        className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <Download className="w-4 h-4" />
                        <span>使用</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              更多模板正在开发中...
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplates;