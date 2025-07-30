import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface TermTooltipProps {
  term?: string;
  explanation?: string;
  metric?: string;
  className?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

// 从MetricTooltip导入的指标解释数据
const METRIC_EXPLANATIONS: Record<string, { title: string; description: string; formula?: string }> = {
  // 回测相关指标
  totalReturn: {
    title: '总收益率',
    description: '策略在整个回测期间的累计收益率，反映策略的整体盈利能力。',
    formula: '(期末净值 - 期初净值) / 期初净值 × 100%'
  },
  annualReturn: {
    title: '年化收益率',
    description: '将策略收益率换算为年化收益率，便于不同时间段的策略比较。',
    formula: '(1 + 总收益率)^(365/天数) - 1'
  },
  sharpeRatio: {
    title: '夏普比率',
    description: '衡量策略风险调整后收益的指标，数值越高表示单位风险获得的超额收益越多。',
    formula: '(策略收益率 - 无风险收益率) / 策略收益率标准差'
  },
  maxDrawdown: {
    title: '最大回撤',
    description: '策略在回测期间从最高点到最低点的最大跌幅，反映策略的风险控制能力。',
    formula: '(最高净值 - 最低净值) / 最高净值 × 100%'
  },
  winRate: {
    title: '胜率',
    description: '盈利交易次数占总交易次数的比例，反映策略的成功概率。',
    formula: '盈利交易次数 / 总交易次数 × 100%'
  },
  totalTrades: {
    title: '总交易次数',
    description: '策略在回测期间执行的买卖交易总数，反映策略的交易频率。'
  },
  avgTradeReturn: {
    title: '平均交易收益',
    description: '每笔交易的平均收益率，反映策略单次交易的盈利能力。',
    formula: '总收益 / 总交易次数'
  },
  profitFactor: {
    title: '盈利因子',
    description: '盈利交易总额与亏损交易总额的比值，数值越大表示策略盈利能力越强。',
    formula: '盈利交易总额 / 亏损交易总额'
  },
  calmarRatio: {
    title: '卡尔马比率',
    description: '年化收益率与最大回撤的比值，衡量策略的风险调整后收益。',
    formula: '年化收益率 / 最大回撤'
  },
  volatility: {
    title: '波动率',
    description: '策略收益率的标准差，反映策略收益的稳定性，数值越小越稳定。',
    formula: '收益率序列的标准差'
  },
  beta: {
    title: 'Beta系数',
    description: '策略相对于基准的敏感度，Beta=1表示与基准同步，>1表示波动更大。',
    formula: 'Cov(策略收益, 基准收益) / Var(基准收益)'
  },
  alpha: {
    title: 'Alpha系数',
    description: '策略相对于基准的超额收益，正值表示跑赢基准，负值表示跑输基准。',
    formula: '策略收益率 - (无风险收益率 + Beta × (基准收益率 - 无风险收益率))'
  },
  informationRatio: {
    title: '信息比率',
    description: '策略超额收益与跟踪误差的比值，衡量主动管理的效果。',
    formula: '超额收益 / 跟踪误差'
  },
  totalStocks: {
    title: '股票数量',
    description: '策略当前推荐的股票总数，反映投资组合的分散程度。'
  },
  avgScore: {
    title: '平均评分',
    description: '所有推荐股票的平均评分，反映整体推荐质量。'
  },
  buyRecommendations: {
    title: '买入推荐',
    description: '被标记为买入建议的股票数量，通常是评分较高的股票。'
  },
  holdRecommendations: {
    title: '持有推荐',
    description: '被标记为持有建议的股票数量，通常是中等评分的股票。'
  },
  sellRecommendations: {
    title: '卖出推荐',
    description: '被标记为卖出建议的股票数量，通常是评分较低的股票。'
  },
  riskLevel: {
    title: '风险等级',
    description: '投资组合的整体风险水平，分为低、中、高三个等级。'
  },
  startDate: {
    title: '开始日期',
    description: '回测或策略执行的起始日期。'
  },
  endDate: {
    title: '结束日期',
    description: '回测或策略执行的结束日期。'
  },
  initialCapital: {
    title: '初始资金',
    description: '策略开始时的初始投资资金。'
  },
  rebalanceFrequency: {
    title: '调仓频率',
    description: '策略重新平衡投资组合的频率。'
  },
  commission: {
    title: '交易佣金',
    description: '每笔交易产生的手续费和佣金。'
  },
  totalWeight: {
    title: '总权重',
    description: '投资组合中所有持仓的权重总和。'
  },
  finalValue: {
    title: '期末价值',
    description: '策略执行结束时的总资产价值。'
  },
  totalProfit: {
    title: '总盈亏',
    description: '策略执行期间的总盈亏金额。'
  },
  monthlyReturn: {
    title: '月收益率',
    description: '策略的月度平均收益率。'
  },
  downside: {
    title: '下行风险',
    description: '策略在不利市场条件下的风险水平。'
  },
  sortinoRatio: {
    title: '索提诺比率',
    description: '类似夏普比率，但只考虑下行波动率。',
    formula: '(策略收益率 - 无风险收益率) / 下行标准差'
  },
  positions: {
    title: '持仓',
    description: '策略当前的股票持仓情况。'
  },
  contribution: {
    title: '贡献度',
    description: '各股票对总收益的贡献程度。'
  },

  // 策略参数相关解释
  shortPeriod: {
    title: '短期周期',
    description: '短期移动平均线的计算周期，数值越小对价格变化越敏感。通常用于识别短期趋势变化。',
    formula: '常用范围：5-20天'
  },
  longPeriod: {
    title: '长期周期',
    description: '长期移动平均线的计算周期，数值越大越平滑，能过滤短期噪音。通常用于确认主要趋势方向。',
    formula: '常用范围：20-100天'
  },
  maType: {
    title: '移动平均线类型',
    description: '计算移动平均线的方法。SMA(简单移动平均)权重相等，EMA(指数移动平均)对近期价格赋予更高权重。'
  },
  volumeConfirm: {
    title: '成交量确认',
    description: '是否需要成交量放大来确认信号。开启后只有在成交量超过阈值时才会产生交易信号，可减少假突破。'
  },
  volumeThreshold: {
    title: '成交量阈值',
    description: '成交量确认的倍数阈值。当日成交量超过平均成交量的该倍数时，才确认交易信号。',
    formula: '推荐范围：1.2-3.0倍'
  },
  stopLoss: {
    title: '止损比例',
    description: '最大可接受的亏损比例。当亏损达到此比例时自动卖出，用于控制风险。',
    formula: '推荐范围：5%-15%'
  },
  takeProfit: {
    title: '止盈比例',
    description: '目标盈利比例。当盈利达到此比例时自动卖出，锁定收益。',
    formula: '推荐范围：10%-30%'
  },
  lookbackPeriod: {
    title: '回看周期',
    description: '历史数据回看的天数。用于计算技术指标和识别历史模式。',
    formula: '常用范围：20-60天'
  },
  trendThreshold: {
    title: '趋势阈值',
    description: '判断趋势强度的阈值。数值越高要求趋势越明确，但可能错过部分机会。',
    formula: '范围：0.3-0.9'
  },
  rebalancePeriod: {
    title: '调仓周期',
    description: '重新平衡投资组合的频率。频率越高能更及时调整，但交易成本也越高。'
  },
  minMarketCap: {
    title: '最小市值',
    description: '筛选股票的最小市值要求。市值越大的股票通常流动性越好，但成长空间可能有限。',
    formula: '单位：亿元'
  },
  maxPositions: {
    title: '最大持仓数',
    description: '投资组合中同时持有的最大股票数量。数量越多分散风险，但管理难度增加。'
  },
  mlModel: {
    title: '机器学习模型',
    description: '用于预测的机器学习算法。不同模型有不同特点：随机森林稳定性好，神经网络学习能力强。'
  },
  featureSet: {
    title: '特征集',
    description: '用于模型训练的特征数据集。基础特征包括价格量数据，扩展特征包括技术指标，全部特征包括基本面数据。'
  },
  confidenceThreshold: {
    title: '置信度阈值',
    description: '模型预测结果的最低置信度要求。阈值越高信号越可靠，但频率可能降低。',
    formula: '范围：0.6-0.9'
  },
  volatilityWindow: {
    title: '波动率窗口',
    description: '计算历史波动率的时间窗口。窗口越长越平滑，越短越敏感。',
    formula: '常用范围：10-30天'
  },
  momentumPeriod: {
    title: '动量周期',
    description: '计算价格动量的时间周期。用于识别价格趋势的强度和方向。',
    formula: '常用范围：5-20天'
  },
  correlationThreshold: {
    title: '相关性阈值',
    description: '股票间相关性的最大允许值。控制投资组合中股票的相关程度，降低集中度风险。',
    formula: '范围：0.3-0.8'
  },

  // RSI相关参数
  rsiPeriod: {
    title: 'RSI周期',
    description: '相对强弱指数的计算周期。周期越短越敏感，越长越平滑。常用14日周期。',
    formula: 'RSI = 100 - 100/(1 + RS)'
  },
  rsiOverbought: {
    title: 'RSI超买线',
    description: 'RSI超买区域的阈值。当RSI超过此值时，表示股票可能被超买，有回调风险。',
    formula: '常用值：70-80'
  },
  rsiOversold: {
    title: 'RSI超卖线',
    description: 'RSI超卖区域的阈值。当RSI低于此值时，表示股票可能被超卖，有反弹机会。',
    formula: '常用值：20-30'
  },

  // 通用参数别名
  period: {
    title: '计算周期',
    description: '技术指标的计算周期。周期越长指标越平滑，越短越敏感。',
    formula: '常用范围：10-30天'
  },
  threshold: {
    title: '触发阈值',
    description: '策略触发交易信号的阈值条件。阈值越高要求信号越强。',
    formula: '根据具体策略调整'
  },
  lookback: {
    title: '回看周期',
    description: '历史数据回看的天数。用于计算技术指标和识别历史模式。',
    formula: '常用范围：20-60天'
  },

  // RSI参数变体（兼容不同命名）
  oversold: {
    title: '超卖线',
    description: 'RSI超卖阈值。低于此值表示超卖，可能反弹。',
    formula: '常用值：20-30'
  },
  overbought: {
    title: '超买线',
    description: 'RSI超买阈值。高于此值表示超买，可能回调。',
    formula: '常用值：70-80'
  },
  oversoldLevel: {
    title: '超卖线',
    description: 'RSI超卖阈值。低于此值表示超卖，可能反弹。',
    formula: '常用值：20-30'
  },
  overboughtLevel: {
    title: '超买线',
    description: 'RSI超买阈值。高于此值表示超买，可能回调。',
    formula: '常用值：70-80'
  },

  // 布林带相关参数
  stdDev: {
    title: '标准差倍数',
    description: '布林带上下轨的标准差倍数。数值越大带宽越宽。',
    formula: '常用值：1.5-2.5倍'
  },
  bandwidthFilter: {
    title: '带宽过滤',
    description: '启用布林带宽度过滤，避免低波动期的假信号。'
  },
  minBandwidth: {
    title: '最小带宽',
    description: '布林带的最小宽度要求，过滤窄幅震荡。',
    formula: '推荐范围：0.01-0.05'
  },

  // MACD相关参数
  fastPeriod: {
    title: '快线周期',
    description: 'MACD快线的计算周期，对价格变化更敏感。',
    formula: '常用值：8-20天'
  },
  slowPeriod: {
    title: '慢线周期',
    description: 'MACD慢线的计算周期，更平滑确认趋势。',
    formula: '常用值：20-35天'
  },
  signalPeriod: {
    title: '信号线周期',
    description: 'MACD信号线的计算周期，用于产生买卖信号。',
    formula: '常用值：5-15天'
  },

  // 网格交易相关参数
  gridSize: {
    title: '网格大小',
    description: '相邻网格线的价格间距百分比。间距越小交易越频繁。',
    formula: '推荐范围：0.5%-5%'
  },
  baseGridSize: {
    title: '基础网格大小',
    description: '网格交易的基础间距，作为动态调整的基准。',
    formula: '推荐范围：0.5%-5%'
  },
  gridLevels: {
    title: '网格层数',
    description: '网格交易的总层数。层数越多覆盖范围越大。',
    formula: '推荐范围：5-25层'
  },
  basePrice: {
    title: '基准价格',
    description: '网格交易的中心价格。通常设为当前价格。'
  },
  minGridSize: {
    title: '最小网格大小',
    description: '动态调整时的最小网格间距，防止过密。',
    formula: '推荐范围：0.2%-1%'
  },

  // 动态调整相关参数
  dynamicAdjustment: {
    title: '动态调整',
    description: '启用网格间距的动态调整，根据市场波动自动调整。'
  },
  volatilityFactor: {
    title: '波动率因子',
    description: '网格动态调整的波动率系数，系数越大越敏感。',
    formula: '推荐范围：0.7-2.0'
  },

  // 多因子相关参数
  priceFactor: {
    title: '价格因子权重',
    description: '多因子模型中价格动量的权重，影响趋势重视程度。',
    formula: '权重总和应为1'
  },
  volumeFactor: {
    title: '成交量因子权重',
    description: '多因子模型中成交量的权重，影响量价关系重视程度。',
    formula: '权重总和应为1'
  },
  fundFlowFactor: {
    title: '资金流向因子权重',
    description: '多因子模型中资金流向的权重，影响资金面重视程度。',
    formula: '权重总和应为1'
  },

  // 支撑阻力相关参数
  useMultiTimeframe: {
    title: '多时间框架',
    description: '使用多个时间框架分析，提高信号准确性。'
  },
  supportResistance: {
    title: '支撑阻力确认',
    description: '需要支撑阻力位确认信号，提高成功率。'
  },

  // 仓位和风险管理参数
  positionSize: {
    title: '仓位大小',
    description: '单笔交易的仓位百分比。仓位越大收益和风险都越大。',
    formula: '推荐范围：5%-50%'
  },
  position_size: {
    title: '仓位大小',
    description: '单笔交易的仓位百分比。仓位越大收益和风险都越大。',
    formula: '推荐范围：5%-50%'
  },

  // 动量相关参数变体
  momentum_period: {
    title: '动量周期',
    description: '计算价格动量的时间周期，识别趋势强度。',
    formula: '常用范围：10-50天'
  },
  rebalance_frequency: {
    title: '再平衡频率',
    description: '重新平衡投资组合的频率，影响调整及时性和成本。'
  }
};

export const TermTooltip: React.FC<TermTooltipProps> = ({
  term,
  explanation,
  metric,
  className = "",
  placement = 'top'
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: string;
    arrowPosition?: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const enterTimer = useRef<NodeJS.Timeout>();
  const leaveTimer = useRef<NodeJS.Timeout>();

  // 确定显示的内容
  const displayContent = metric ? METRIC_EXPLANATIONS[metric] : { title: term || '', description: explanation || '' };
  
  if (!displayContent || (!displayContent.title && !displayContent.description)) {
    return null;
  }

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;
    
    // 获取实际的tooltip尺寸
    let tooltipWidth = 300;
    let tooltipHeight = (displayContent as any).formula ? 120 : 80;
    
    // 如果tooltip已经渲染，获取实际尺寸
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipWidth = tooltipRect.width;
      tooltipHeight = tooltipRect.height;
    }
    
    const arrowSize = 6;
    const gap = 8;

    let top = 0;
    let left = 0;
    let actualPlacement = placement;

    // 计算位置
    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipHeight - arrowSize - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        
        if (top < 16) {
          actualPlacement = 'bottom';
          top = triggerRect.bottom + arrowSize + gap;
        }
        break;
        
      case 'bottom':
        top = triggerRect.bottom + arrowSize + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        
        if (top + tooltipHeight > viewportHeight - 16) {
          actualPlacement = 'top';
          top = triggerRect.top - tooltipHeight - arrowSize - gap;
        }
        break;
        
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.left - tooltipWidth - arrowSize - gap;
        
        if (left < 16) {
          actualPlacement = 'right';
          left = triggerRect.right + arrowSize + gap;
        }
        break;
        
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.right + arrowSize + gap;
        
        if (left + tooltipWidth > viewportWidth - 16) {
          actualPlacement = 'left';
          left = triggerRect.left - tooltipWidth - arrowSize - gap;
        }
        break;
    }

    // 水平边界检查
    if (actualPlacement === 'top' || actualPlacement === 'bottom') {
      if (left < 16) {
        left = 16;
      } else if (left + tooltipWidth > viewportWidth - 16) {
        left = viewportWidth - tooltipWidth - 16;
      }
    }

    // 垂直边界检查
    if (actualPlacement === 'left' || actualPlacement === 'right') {
      if (top < 16) {
        top = 16;
      } else if (top + tooltipHeight > viewportHeight - 16) {
        top = viewportHeight - tooltipHeight - 16;
      }
    }

    // 计算箭头位置（始终基于trigger中心点和tooltip最终位置）
    let arrowPosition = 50; // 默认50%

    if (actualPlacement === 'top' || actualPlacement === 'bottom') {
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipCenter = left + tooltipWidth / 2;
      const offset = triggerCenter - tooltipCenter;
      arrowPosition = 50 + (offset / tooltipWidth * 100);
      // 限制箭头位置在10%-90%之间
      arrowPosition = Math.max(10, Math.min(90, arrowPosition));
    }

    if (actualPlacement === 'left' || actualPlacement === 'right') {
      const triggerCenter = triggerRect.top + triggerRect.height / 2;
      const tooltipCenter = top + tooltipHeight / 2;
      const offset = triggerCenter - tooltipCenter;
      arrowPosition = 50 + (offset / tooltipHeight * 100);
      // 限制箭头位置在10%-90%之间
      arrowPosition = Math.max(10, Math.min(90, arrowPosition));
    }

    setPosition({ top, left, placement: actualPlacement, arrowPosition });
  };

  const showTooltip = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
    }
    
    if (!visible) {
      enterTimer.current = setTimeout(() => {
        setVisible(true);
        // 先立即计算一次位置
        requestAnimationFrame(() => {
          updatePosition();
          // 在下一帧再次计算，确保tooltip已完全渲染
          requestAnimationFrame(updatePosition);
        });
      }, 100);
    }
  };

  const hideTooltip = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = undefined;
    }
    
    leaveTimer.current = setTimeout(() => {
      setVisible(false);
      setPosition(null);
    }, 100);
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleTooltipMouseEnter = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = undefined;
    }
  };

  const handleTooltipMouseLeave = () => {
    hideTooltip();
  };

  // 窗口大小变化时重新计算位置
  useEffect(() => {
    if (!visible) return;

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [visible]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (enterTimer.current) {
        clearTimeout(enterTimer.current);
      }
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
      }
    };
  }, []);

  const getArrowStyle = () => {
    if (!position) return {};
    
    const { placement: actualPlacement, arrowPosition = 50 } = position;
    const arrowSize = 6;
    
    switch (actualPlacement) {
      case 'top':
        return {
          bottom: `-${arrowSize}px`,
          left: `${arrowPosition}%`,
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid var(--tooltip-bg-color)`,
        };
      case 'bottom':
        return {
          top: `-${arrowSize}px`,
          left: `${arrowPosition}%`,
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid var(--tooltip-bg-color)`,
        };
      case 'left':
        return {
          right: `-${arrowSize}px`,
          top: `${arrowPosition}%`,
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid var(--tooltip-bg-color)`,
        };
      case 'right':
        return {
          left: `-${arrowSize}px`,
          top: `${arrowPosition}%`,
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid var(--tooltip-bg-color)`,
        };
      default:
        return {};
    }
  };

  const tooltipContent = visible && position ? (
    <div
      ref={tooltipRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: position.top,
        left: position.left,
        '--tooltip-bg-color': document.documentElement.classList.contains('dark') ? 'rgb(31 41 55)' : 'rgb(255 255 255)',
      } as React.CSSProperties}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      <div className="relative bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-600" style={{ width: '300px' }}>
        <div className="font-medium mb-1">{displayContent.title}</div>
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{displayContent.description}</div>
        
        {(displayContent as any).formula && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mt-2">
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">计算公式:</div>
            <div className="font-mono text-xs text-gray-700 dark:text-gray-300">{(displayContent as any).formula}</div>
          </div>
        )}
        
        {/* 箭头 */}
        <div
          className="absolute w-0 h-0"
          style={getArrowStyle()}
        />
      </div>
    </div>
  ) : null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="ml-1 p-0.5 text-gray-400 hover:text-blue-500 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
        type="button"
        title={displayContent.title}
      >
        <HelpCircle className="w-3 h-3" />
      </button>

      {typeof document !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </div>
  );
};
