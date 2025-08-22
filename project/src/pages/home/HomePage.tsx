import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import './HomePage.css';
import { 
  Bot, 
  TrendingUp, 
  Clock, 
  Zap, 
  BarChart3, 
  FileText, 
  ArrowRight, 
  Calendar,
  DollarSign,
  Brain,
  Sparkles,
  Activity,
  Target,
  BookOpen,
  Play,
  Plus
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useNavigation } from '../../router/navigation';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { pythonApiClient } from '../../services/pythonApiClient';

// 快速启动卡片组件
const QuickStartCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          gradient: 'gradient-bg-blue',
          hover: 'card-hover-blue',
          text: 'text-blue-600 dark:text-blue-400'
        };
      case 'green':
        return {
          gradient: 'gradient-bg-green', 
          hover: 'card-hover-green',
          text: 'text-green-600 dark:text-green-400'
        };
      case 'purple':
        return {
          gradient: 'gradient-bg-purple',
          hover: 'card-hover-purple', 
          text: 'text-purple-600 dark:text-purple-400'
        };
      case 'orange':
        return {
          gradient: 'gradient-bg-orange',
          hover: 'card-hover-orange',
          text: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          gradient: 'bg-gray-500',
          hover: '',
          text: 'text-gray-600'
        };
    }
  };
  
  const colorClasses = getColorClasses(color);
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer
        bg-white dark:bg-slate-800 
        rounded-2xl p-6 shadow-lg hover:shadow-xl
        border border-gray-200 dark:border-gray-700
        ${colorClasses.hover}
        transition-all duration-300 ease-out
        animate-scale
      `}
    >
      <div className="flex items-start space-x-4">
        <div className={`
          flex items-center justify-center w-12 h-12 
          rounded-xl ${colorClasses.gradient}
          text-white shadow-lg
          transition-all duration-300
        `}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <ArrowRight className={`
          w-5 h-5 ${colorClasses.text}
          arrow-animation
        `} />
      </div>
    </div>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, icon, color }) => {
  const getIconBgClass = (color: string) => {
    switch (color) {
      case 'blue': return 'icon-bg-blue';
      case 'green': return 'icon-bg-green';
      case 'purple': return 'icon-bg-purple';
      case 'orange': return 'icon-bg-orange';
      default: return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className={`text-sm font-medium ${
              change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`
          flex items-center justify-center w-12 h-12 
          rounded-lg ${getIconBgClass(color)}
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// 最近活动项组件
const ActivityItem: React.FC<{
  title: string;
  description: string;
  time: string;
  type: 'workflow' | 'review';
  onClick: () => void;
}> = ({ title, description, time, type, onClick }) => (
  <div 
    onClick={onClick}
    className="
      flex items-center space-x-4 p-4 rounded-lg 
      hover:bg-gray-50 dark:hover:bg-slate-700 
      cursor-pointer transition-colors duration-200
      border border-transparent hover:border-gray-200 dark:hover:border-gray-600
    "
  >
    <div className={`
      flex items-center justify-center w-10 h-10 rounded-lg
      ${type === 'workflow' 
        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
        : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
      }
    `}>
      {type === 'workflow' ? <Bot className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
        {title}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {description}
      </p>
    </div>
    <div className="text-xs text-gray-400 dark:text-gray-500">
      {time}
    </div>
  </div>
);

// 市场数据卡片组件
const MarketCard: React.FC<{
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
}> = ({ symbol, name, price, change, changePercent }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{symbol}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-white">{price}</p>
        <p className={`text-xs font-medium ${
          change.startsWith('+') ? 'text-green-600' : 'text-red-600'
        }`}>
          {change} ({changePercent})
        </p>
      </div>
    </div>
  </div>
);

export const HomePage: React.FC = observer(() => {
  const { user } = useStore();
  const nav = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    workflows: 0,
    reviews: 0,
    totalAnalysis: 0,
    successRate: '0%'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);

  // 数据加载
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // 总是加载市场数据（公开数据）
        const marketDataPromise = pythonApiClient.getMarketData();
        
        if (user.isAuthenticated) {
          // 用户已登录，加载用户相关数据
          const [userStatsResponse, recentActivitiesResponse, marketDataResponse] = await Promise.all([
            pythonApiClient.getUserStats(),
            pythonApiClient.getRecentActivities(),
            marketDataPromise
          ]);
          
          // 处理用户统计数据
          if (userStatsResponse.success) {
            setStats(userStatsResponse.data.stats);
          } else {
            console.warn('获取用户统计失败:', userStatsResponse.message);
            setStats({ workflows: 0, reviews: 0, totalAnalysis: 0, successRate: '0%' });
          }
          
          // 处理最近活动数据
          if (recentActivitiesResponse.success) {
            setRecentActivities(recentActivitiesResponse.data.activities);
          } else {
            console.warn('获取最近活动失败:', recentActivitiesResponse.message);
            setRecentActivities([]);
          }
          
          // 处理市场数据
          if (marketDataResponse.success) {
            setMarketData(marketDataResponse.data.marketData);
          } else {
            console.warn('获取市场数据失败:', marketDataResponse.message);
            setMarketData([]);
          }
        } else {
          // 未登录用户，只加载市场数据和默认值
          setStats({ workflows: 0, reviews: 0, totalAnalysis: 0, successRate: '0%' });
          setRecentActivities([]);
          
          const marketDataResponse = await marketDataPromise;
          if (marketDataResponse.success) {
            setMarketData(marketDataResponse.data.marketData);
          } else {
            console.warn('获取市场数据失败:', marketDataResponse.message);
            setMarketData([]);
          }
        }
        
      } catch (error) {
        console.error('数据加载失败:', error);
        // 设置默认值，确保页面正常显示
        setStats({ workflows: 0, reviews: 0, totalAnalysis: 0, successRate: '0%' });
        setRecentActivities([]);
        setMarketData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user.isAuthenticated]); // 依赖用户登录状态

  const handleCreateWorkflow = () => {
    if (user.isAuthenticated) {
      nav.toAIWorkflow();
    } else {
      // 未登录用户引导到登录页面
      nav.toLogin('/ai-workflow'); // 传入返回地址
    }
  };

  const handleCreateReview = () => {
    if (user.isAuthenticated) {
      nav.toReview();
    } else {
      // 未登录用户引导到登录页面
      nav.toLogin('/review'); // 传入返回地址
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" text="正在加载首页..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* 头部欢迎区域 */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                {user.isAuthenticated ? `欢迎回来，${user.currentUser?.username || '用户'}！` : '欢迎来到 FindValue AI'}
              </h1>
              <p className="text-xl text-blue-100 mb-6 max-w-2xl">
                智能投资助手平台，结合AI工作流和复盘分析，助您在金融市场中发现价值、把握机会
              </p>
              
              {/* 登录/注册按钮（仅未登录用户可见） */}
              {!user.isAuthenticated && (
                <div className="flex items-center space-x-4 mb-6">
                  <button 
                    onClick={() => nav.toLogin()}
                    className="
                      px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold
                      hover:bg-blue-50 transition-colors duration-200
                      shadow-lg hover:shadow-xl
                    "
                  >
                    立即登录
                  </button>
                  <button 
                    onClick={() => nav.toRegister()}
                    className="
                      px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold
                      hover:bg-white hover:text-blue-600 transition-all duration-200
                    "
                  >
                    免费注册
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>AI驱动的投资分析</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>精准的市场洞察</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>智能化决策支持</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-64 h-48 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Activity className="w-24 h-24 text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计数据概览 */}
        {user.isAuthenticated && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="AI工作流"
              value={stats.workflows}
              change="+3 本月"
              icon={<Bot className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="交易复盘"
              value={stats.reviews}
              change="+2 本月"
              icon={<FileText className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="分析报告"
              value={stats.totalAnalysis}
              change="+24 本月"
              icon={<BarChart3 className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              title="成功率"
              value={stats.successRate}
              change="+2.3% 本月"
              icon={<TrendingUp className="w-6 h-6" />}
              color="orange"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：快速启动 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 快速启动卡片 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-3 text-yellow-500" />
                快速启动
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuickStartCard
                  title="创建AI工作流"
                  description={
                    user.isAuthenticated 
                      ? "利用人工智能分析市场数据，生成投资策略和决策建议"
                      : "登录后利用AI分析市场数据，生成智能投资策略"
                  }
                  icon={<Bot className="w-6 h-6" />}
                  color="blue"
                  onClick={handleCreateWorkflow}
                />
                <QuickStartCard
                  title="开始AI复盘"
                  description={
                    user.isAuthenticated 
                      ? "智能分析交易记录，总结经验教训，优化投资策略"
                      : "登录后使用AI智能分析交易记录，优化投资策略"
                  }
                  icon={<BookOpen className="w-6 h-6" />}
                  color="green"
                  onClick={handleCreateReview}
                />
              </div>
            </div>

            {/* 功能导航 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-purple-500" />
                核心功能
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: '股票分析', icon: <TrendingUp className="w-5 h-5" />, color: 'blue' },
                  { name: '策略回测', icon: <BarChart3 className="w-5 h-5" />, color: 'green' },
                  { name: '风险评估', icon: <Target className="w-5 h-5" />, color: 'red' },
                  { name: '市场监控', icon: <Activity className="w-5 h-5" />, color: 'yellow' }
                ].map((item, index) => {
                  const getItemBgClass = (color: string) => {
                    switch (color) {
                      case 'blue': return 'icon-bg-blue';
                      case 'green': return 'icon-bg-green';
                      case 'red': return 'icon-bg-red';
                      case 'yellow': return 'icon-bg-yellow';
                      default: return 'bg-gray-100 text-gray-600';
                    }
                  };
                  
                  return (
                    <div
                      key={index}
                      className="
                        bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700
                        hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer
                        text-center group
                      "
                    >
                      <div className={`
                        flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg
                        ${getItemBgClass(item.color)}
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        {item.icon}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 市场动态 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-3 text-green-500" />
                市场动态
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketData.map((stock, index) => (
                  <MarketCard key={index} {...stock} />
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：最近活动和快捷操作 */}
          <div className="space-y-8">
            {/* 最近活动 */}
            {user.isAuthenticated && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    最近活动
                  </h3>
                </div>
                <div className="p-2">
                  {recentActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      title={activity.title}
                      description={activity.description}
                      time={activity.time}
                      type={activity.type}
                      onClick={() => {
                        if (activity.type === 'workflow') {
                          nav.toAIWorkflow();
                        } else {
                          nav.toReview();
                        }
                      }}
                    />
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => nav.toAIWorkflow()}
                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    查看所有活动 →
                  </button>
                </div>
              </div>
            )}

            {/* 快捷操作 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                  快捷操作
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={handleCreateWorkflow}
                  className="
                    w-full flex items-center space-x-3 p-3 rounded-lg
                    bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30
                    text-blue-700 dark:text-blue-300 transition-colors duration-200
                  "
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">{user.isAuthenticated ? '新建工作流' : '登录创建工作流'}</span>
                </button>
                <button 
                  onClick={handleCreateReview}
                  className="
                    w-full flex items-center space-x-3 p-3 rounded-lg
                    bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30
                    text-green-700 dark:text-green-300 transition-colors duration-200
                  "
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{user.isAuthenticated ? '开始复盘' : '登录开始复盘'}</span>
                </button>
                <button 
                  onClick={() => {
                    if (user.isAuthenticated) {
                      // TODO: 跳转到报告页面
                      console.log('查看报告');
                    } else {
                      nav.toLogin();
                    }
                  }}
                  className="
                    w-full flex items-center space-x-3 p-3 rounded-lg
                    bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30
                    text-purple-700 dark:text-purple-300 transition-colors duration-200
                  "
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">{user.isAuthenticated ? '查看报告' : '登录查看报告'}</span>
                </button>
              </div>
            </div>

            {/* AI助手提示 */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="flex items-start space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI助手建议</h4>
                  <p className="text-sm text-purple-100 mb-4">
                    {user.isAuthenticated 
                      ? '基于当前市场情况，建议关注科技股的投资机会。是否需要创建相关的分析工作流？'
                      : '体验智能投资分析，发现更多市场机会。立即注册开始使用AI助手！'
                    }
                  </p>
                  <button 
                    onClick={() => {
                      if (user.isAuthenticated) {
                        handleCreateWorkflow();
                      } else {
                        nav.toRegister();
                      }
                    }}
                    className="
                      bg-white/20 hover:bg-white/30 backdrop-blur-sm
                      px-4 py-2 rounded-lg text-sm font-medium
                      transition-colors duration-200
                    "
                  >
                    {user.isAuthenticated ? '立即创建' : '立即注册'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default HomePage;