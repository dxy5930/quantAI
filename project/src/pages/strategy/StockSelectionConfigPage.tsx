import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useStore, useStrategyDetail, useStrategyActions, useShare } from "../../hooks";
import { stockSelectionApi, type KeywordTag, type StockOption, type RecommendStocksResponse } from "../../services/api/stockSelectionApi";
import { stockApi } from "../../services/api/stockApi";
import { strategyApi } from "../../services/api/strategyApi";
import { UserLevel } from "../../types";
import {
  Target,
  Settings,
  Loader2,
  Search,
  X,
  Plus,
  ChevronDown,
  Lightbulb,
  Play,
  Edit3,
  Tag,
  TrendingUp,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { BackButton } from "../../components";
import { AIAnalysisLoader } from "../../components/common";
import { StrategyInteractionButtons } from "../../components/strategy";

const StockSelectionConfigPage: React.FC = observer(() => {
  const { strategy, app, user } = useStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // 判断是否为创建新策略
  const isCreating = !id;

  // 使用新的策略详情hook（仅在编辑时使用）
  const { strategy: strategyItem, loading, error } = useStrategyDetail(id);

  // 判断是否为当前用户的策略
  const isOwnStrategy = strategyItem && user.currentUser && strategyItem.author?.id === user.currentUser.id;

  // 状态管理
  const [originalQuery, setOriginalQuery] = useState("");
  const [keywordTags, setKeywordTags] = useState<KeywordTag[]>([]);
  const [structuredConditions, setStructuredConditions] = useState<any[]>([]);
  const [positions, setPositions] = useState<StockOption[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // 推荐股票相关状态
  const [recommendedStocks, setRecommendedStocks] = useState<RecommendStocksResponse[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [extractingKeywords, setExtractingKeywords] = useState(false);
  
  // AI分析状态
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isApiComplete, setIsApiComplete] = useState(false);
  const [pendingResults, setPendingResults] = useState<{
    keywords: KeywordTag[];
    recommendations: RecommendStocksResponse[];
    structuredConditions: any[];
  } | null>(null);
  
  // 创建策略时的状态
  const [strategyName, setStrategyName] = useState("");
  const [strategyDescription, setStrategyDescription] = useState("");
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);

  // 用户交互状态
  const [userEngagement, setUserEngagement] = useState<{
    isLiked: boolean;
    isFavorited: boolean;
  } | null>(null);

  // 使用策略操作 hook
  const strategyActions = useStrategyActions({
    strategyId: id,
    strategyName: strategyItem?.name,
    onSuccess: (message) => app.showSuccess(message),
    onError: (error) => app.showError(error),
  });

  // 初始化数据 - 从后端获取配置数据
  useEffect(() => {
    const loadStrategyConfig = async () => {
      if (strategyItem && id && !isCreating) {
        try {
          // 获取策略配置数据
          const result = await stockSelectionApi.getStrategyConfig(id);
          console.log('API返回的完整结果:', result);
          if (result.success && result.data) {
            const configData = result.data;
            console.log('解析的配置数据:', configData);
            
            // 直接使用API返回的数据，不做处理
            setOriginalQuery(configData.originalQuery || strategyItem.description || "");
            
            // 判断是否为当前用户的策略
            const isOwnStrategy = strategyItem && user.currentUser && strategyItem.author?.id === user.currentUser.id;
            
            if (isOwnStrategy) {
              // 如果是自己的策略，正常显示已保存的关键词和股票
              if (configData.keywords) {
                setKeywordTags(configData.keywords);
              }
              if (configData.selectedStocks) {
                setPositions(configData.selectedStocks);
              }
            } else {
              // 如果是引用他人的策略，不自动显示关键词，等用户手动确认
              // 只设置原始查询语句，不显示关键词和推荐股票
              // 让用户手动点击"确定"来重新生成
            }
          }

          // 获取用户交互状态
          try {
            const detailResult = await strategyApi.getStrategyDetail(id);
            if (detailResult.success && detailResult.data) {
              const data = detailResult.data as any;
              if (data.userEngagement) {
                setUserEngagement(data.userEngagement);
              }
            }
          } catch (error) {
            console.log('获取用户交互状态失败:', error);
          }
        } catch (error) {
          console.error('加载策略配置失败:', error);
          // 使用默认值，但不自动解析关键词
          setOriginalQuery(strategyItem.description || "");
          // 对于他人的策略，不自动提取关键词
        }
      }
    };

    loadStrategyConfig();
  }, [strategyItem, id, app, isCreating, user.currentUser]);

  // AI提取关键词
  const extractKeywordsFromQuery = async (query: string) => {
    if (!query.trim()) return;
    
    // 启动AI分析动画
    setIsAiAnalyzing(true);
    setShowResults(false);
    setIsApiComplete(false);
    setKeywordTags([]);
    setStructuredConditions([]);
    setRecommendedStocks([]);
    setPendingResults(null);
    
    try {
      console.log('开始调用AI分析接口...', { input: query, strategyId: id });
      const result = await stockSelectionApi.analyzeStrategy({ input: query, strategyId: id });
      console.log('AI分析接口响应:', result);
      
      if (result.success && result.data) {
        const keywords = result.data.keywords.map((kw: any) => ({
          id: kw.id,
          text: kw.text,
          type: 'other' as KeywordTag['type'],
          confidence: kw.confidence
        }));
        
        // 提取结构化条件
        const structuredConditions = result.data.structured_conditions || [];
        
        // 暂存结果，等待动画完成
        setPendingResults({
          keywords,
          recommendations: result.data?.recommendations || [],
          structuredConditions: structuredConditions
        });
        
        // 标记API完成
        setIsApiComplete(true);
              } else {
          setIsAiAnalyzing(false);
          setIsApiComplete(false);
          app.showError(textMap.error.analysis + '：' + (result.message || '未知错误'));
        }
      } catch (error) {
        console.error('分析策略失败:', error);
        setIsAiAnalyzing(false);
        setIsApiComplete(false);
        app.showError(textMap.error.analysis);
    }
  };

  // AI动画完成回调
  const handleAiAnalysisComplete = () => {
    setIsAiAnalyzing(false);
    setIsApiComplete(false);
    
    // 显示暂存的结果
    if (pendingResults) {
      setKeywordTags(pendingResults.keywords);
      setRecommendedStocks(pendingResults.recommendations);
      setStructuredConditions(pendingResults.structuredConditions);
      setShowResults(true);
      
      if (pendingResults.recommendations.length > 0) {
        app.showSuccess(`为您推荐了 ${pendingResults.recommendations.length} 只相关股票`);
      } else {
        app.showInfo(textMap.info.noRecommendations);
      }
      
      setPendingResults(null);
    } else {
      // 如果没有结果，显示空状态
      setShowResults(true);
      app.showInfo(textMap.info.analysisComplete);
    }
  };

  const handleRemoveKeyword = async (keywordId: string) => {
    const newTags = keywordTags.filter(tag => tag.id !== keywordId);
    setKeywordTags(newTags);
    
    // 如果还有剩余关键词，基于剩余关键词重新获取推荐
    if (newTags.length > 0) {
      // 清空当前推荐并重新开始AI分析
      setShowResults(false);
      setRecommendedStocks([]);
      setIsAiAnalyzing(true);
      setIsApiComplete(false);
      setPendingResults(null);
      
      try {
        console.log('基于剩余关键词重新分析...', newTags);
        
        // 启动重新分析流程
        setIsAiAnalyzing(true);
        setIsApiComplete(false);
        setRecommendedStocks([]);
        setStructuredConditions([]);
        setPendingResults(null);
        
        // 构造基于关键词的查询语句
        const keywordQuery = newTags.map(tag => tag.text).join('、');
        console.log('重新构造的查询语句:', keywordQuery);
        
        // 调用真实的分析接口
        const result = await stockSelectionApi.analyzeStrategy({ input: keywordQuery, strategyId: id });
        console.log('基于关键词重新分析的结果:', result);
        
        if (result.success && result.data) {
          // 暂存结果，等待动画完成
          setPendingResults({
            keywords: newTags, // 保持用户已选择的关键词
            recommendations: result.data?.recommendations || [],
            structuredConditions: result.data?.structured_conditions || []
          });
          
          // 标记API完成
          setIsApiComplete(true);
        } else {
          setIsAiAnalyzing(false);
          setIsApiComplete(false);
          app.showError(textMap.error.reAnalysis + '：' + (result.message || '未知错误'));
        }
      } catch (error) {
        console.error('重新分析失败:', error);
        setIsAiAnalyzing(false);
        setIsApiComplete(false);
        app.showError(textMap.error.reAnalysis);
      }
    } else {
      // 如果没有关键词了，清空推荐股票并重置状态
      setRecommendedStocks([]);
      setShowResults(false);
      
      // 如果有原始查询，提示用户可以重新分析
      if (originalQuery.trim()) {
        app.showInfo(textMap.info.noKeywords);
      }
    }
  };

  const handleRemoveStock = (symbol: string) => {
    setPositions(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  const handleRunSelection = async () => {
    setIsRunning(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      app.showSuccess("选股完成！");
      navigate(`/strategy/${id}/results`);
    } catch (error) {
      app.showError("选股失败，请重试");
    } finally {
      setIsRunning(false);
    }
  };

  // 保存策略配置或创建新策略
  const handleSave = async () => {
    setIsCreatingStrategy(true);
    
    try {
      let targetStrategyId: string;
      let targetStrategyName: string;

      if (isCreating) {
        // 创建新策略
        if (!strategyName.trim() || !strategyDescription.trim()) {
          app.showError("请填写策略名称和描述");
          return;
        }

        const createData = {
          name: strategyName.trim(),
          description: strategyDescription.trim(),
          category: "自定义", // 默认分类
          strategyType: "stock_selection",
          difficulty: "medium",
          parameters: [],
          tags: keywordTags.map(tag => tag.text),
          isPublic: false,
          originalQuery,
          keywords: keywordTags,
          selectedStocks: positions
        };

        console.log('创建新策略，数据:', createData);
        const result = await strategyApi.createStrategy(createData);
        
        if (result.success && result.data) {
          targetStrategyId = result.data.id;
          targetStrategyName = result.data.name || strategyName.trim();
          console.log('新策略创建成功:', targetStrategyId);
        } else {
          throw new Error('创建策略失败');
        }
      } else if (isOwnStrategy) {
        // 编辑自己的策略 - 更新现有策略
        console.log('更新自己的策略:', id);
        
        const updateData = {
          name: strategyName.trim() || strategyItem?.name,
          description: strategyDescription.trim() || strategyItem?.description,
          category: strategyItem?.category || "自定义",
          strategyType: "stock_selection",
          difficulty: "medium",
          parameters: [],
          tags: keywordTags.map(tag => tag.text),
          isPublic: strategyItem?.isPublic || false,
          originalQuery,
          keywords: keywordTags,
          selectedStocks: positions
        };

        const result = await strategyApi.updateStrategy(id!, updateData);
        
        if (result.success && result.data) {
          targetStrategyId = result.data.id;
          targetStrategyName = result.data.name || strategyName.trim();
          console.log('策略更新成功:', targetStrategyId);
        } else {
          throw new Error('更新策略失败');
        }
        
        targetStrategyId = id!;
        targetStrategyName = strategyItem?.name || "我的策略";
      } else {
        // 编辑他人策略 - 复制策略而非直接修改
        console.log('复制他人策略:', id);
        
        // 先复制策略
        const copyResult = await strategyApi.copyStrategy(id!, {
          name: `${strategyItem?.name} - 我的配置`,
          description: strategyItem?.description,
          category: strategyItem?.category || "自定义"
        });

        if (copyResult.success && copyResult.data) {
          targetStrategyId = copyResult.data.id;
          targetStrategyName = copyResult.data.name;
          console.log('策略复制成功:', targetStrategyId, targetStrategyName);
        } else {
          throw new Error('复制策略失败');
        }
      }

      // 保存配置到目标策略
      const configData = {
        strategyType: "stock_selection",
        originalQuery,
        keywords: keywordTags,
        selectedStocks: positions
      };

      console.log('保存策略配置到:', targetStrategyId, configData);
      const saveResult = await stockSelectionApi.saveStrategy(targetStrategyId, configData);
      
      if (saveResult.success) {
        if (isCreating) {
          app.showSuccess("策略创建成功！");
          // 创建新策略后跳转到我的策略页面
          navigate('/my-strategies');
        } else if (isOwnStrategy) {
          app.showSuccess("策略配置保存成功！");
          // 保存自己的策略后留在当前页面
          navigate(`/strategy/${targetStrategyId}/stock-selection-config`);
        } else {
          app.showSuccess(`基于原策略创建了新策略"${targetStrategyName}"！`);
          // 创建副本后跳转到我的策略页面
          navigate('/my-strategies');
        }
      } else {
        throw new Error('保存配置失败');
      }
      
    } catch (error) {
      console.error("保存失败:", error);
      app.showError(
        error instanceof Error 
          ? error.message 
          : (isCreating ? "创建策略失败，请重试" : isOwnStrategy ? "保存配置失败，请重试" : "复制策略失败，请重试")
      );
    } finally {
      setIsCreatingStrategy(false);
    }
  };

  const handlePublishToSquare = () => {
    strategyActions.handlePublish(stockSelectionApi.publishToSquare);
  };

  const { shareStrategy: handleShareStrategy } = useShare();

  const handleShare = async () => {
    if (id) {
      await handleShareStrategy(id, strategyName);
    }
  };

  // 文本映射
  const textMap = {
    // 用户等级
    userLevel: {
      [UserLevel.NORMAL]: '普通用户',
      [UserLevel.PREMIUM]: '高级用户',
      [UserLevel.SUPER]: '超级用户',
    },
    // 成功消息
    success: {
      publish: '策略已发布到广场！',
      save: '配置保存成功！',
      shareLink: '分享链接已复制到剪贴板',
      createStrategy: '策略创建成功！',
      addStock: '已添加到选股列表',
    },
    // 错误消息
    error: {
      publish: '发布失败，请重试',
      save: '保存失败，请重试',
      shareLink: '生成分享链接失败，请重试',
      stockExists: '已在选股列表中',
      analysis: '分析策略失败，请重试',
      reAnalysis: '重新分析失败，请重试',
    },
    // 信息提示
    info: {
      noRecommendations: '未找到匹配的股票推荐',
      noKeywords: '已清空所有关键词，您可以重新点击"确定"进行分析',
      analysisComplete: '分析完成，但未找到相关结果',
    }
  };


  const handleAddRecommendedStock = (stock: RecommendStocksResponse) => {
    // 直接使用API返回的股票数据，不做处理
    const stockOption = {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      marketCap: stock.marketCap
    };
    
    if (!positions.find(s => s.symbol === stock.symbol)) {
      setPositions(prev => [...prev, stockOption as any]);
      app.showSuccess(`已添加 ${stock.name} 到选股列表`);
    } else {
      app.showInfo(`${stock.name} ${textMap.error.stockExists}`);
    }
  };

  const getTagColor = (type: KeywordTag['type']) => {
    switch (type) {
      case 'sector':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'metric':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'condition':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading && !isCreating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            加载选股配置...
          </span>
        </div>
      </div>
    );
  }

  if ((error || !strategyItem) && !isCreating) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">{error || "策略未找到"}</div>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* 策略信息卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isCreating ? "创建选股策略" : isOwnStrategy ? "编辑选股策略" : "引用选股策略"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isCreating 
                  ? "通过AI分析创建个性化的股票选择策略" 
                  : isOwnStrategy
                  ? `编辑您的策略"${strategyItem?.name}"`
                  : `基于"${strategyItem?.name}"创建您的专属策略副本`
                }
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              选股策略
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              {strategyItem?.category || '自定义'}
            </span>
          </div>

          {/* 创建新策略时的输入表单 */}
          {isCreating && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  策略名称
                </label>
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="请输入策略名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  策略描述
                </label>
                <textarea
                  value={strategyDescription}
                  onChange={(e) => setStrategyDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="请输入策略描述"
                />
              </div>
            </div>
          )}

          {/* 编辑模式下显示原策略信息和交互按钮 */}
          {!isCreating && strategyItem && (
            <div className="mt-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  原策略：{strategyItem.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {strategyItem.description}
                </p>
                
                {/* 引用说明 */}
                {!isOwnStrategy && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 您正在引用他人的策略。请在下方调整查询语句后点击"确定"重新生成关键词和推荐股票。
                    </p>
                  </div>
                )}
                
                {/* 交互按钮 */}
                <StrategyInteractionButtons
                  strategy={strategyItem}
                  userEngagement={userEngagement}
                  onEngagementChange={setUserEngagement}
                  size="sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 原始查询语句 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              选股条件描述
            </h3>
          </div>
          <button
            onClick={() => extractKeywordsFromQuery(originalQuery)}
            disabled={!originalQuery.trim() || isAiAnalyzing}
            className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 group overflow-hidden"
          >
            {/* 背景动效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* 图标和文字 */}
            <div className="relative flex items-center space-x-2">
              {isAiAnalyzing ? (
                <>
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <div className="absolute inset-0 w-5 h-5 border-2 border-white/30 rounded-full animate-pulse" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent animate-pulse">
                    AI分析中...
                  </span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Target className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <div className="absolute -inset-1 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                  <span className="relative">
                    ✨ AI智能分析
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/50 group-hover:w-full transition-all duration-300" />
                  </span>
                </>
              )}
            </div>
            
            {/* 闪烁效果 */}
            {!isAiAnalyzing && (
              <div className="absolute inset-0 -skew-x-12 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
            )}
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              原始查询语句
            </label>
            <textarea
              value={originalQuery}
              onChange={(e) => setOriginalQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              placeholder="描述您的选股条件，例如：寻找高成长性的科技股..."
            />
          </div>

          {/* 关键词标签区域 - 始终显示 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              解析的关键词
            </label>
            <div className="flex flex-wrap gap-2">
              {keywordTags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag.type)}`}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.text}
                </span>
              ))}
              {keywordTags.length === 0 && !isAiAnalyzing && (
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {originalQuery.trim() ? '点击"确定"按钮开始AI分析' : '请先输入查询语句'}
                </span>
              )}
            </div>
          </div>

          {/* 结构化条件显示区域 */}
          {structuredConditions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                结构化条件
              </label>
              <div className="flex flex-wrap gap-2">
                {structuredConditions.map((condition, index) => {
                  // 格式化结构化条件显示
                  const formatStructuredCondition = (condition: any) => {
                    const { field, operator, value, period } = condition;

                    // 操作符映射
                    const operatorMap: { [key: string]: string } = {
                      ">": " > ",
                      "<": " < ",
                      ">=": " ≥ ",
                      "<=": " ≤ ",
                      "=": " = ",
                      "!=": " ≠ ",
                      between: " 介于 ",
                      in: " 属于 ",
                    };

                    const operatorText = operatorMap[operator] || ` ${operator} `;

                    // 格式化数值（如果是百分比相关的字段，添加%符号）
                    const formatValue = (val: any, fieldName: string) => {
                      if (typeof val === "number") {
                        const percentFields = [
                          "收益率",
                          "回撤",
                          "最大回撤",
                          "毛利率",
                          "股息率",
                          "ROE",
                        ];
                        if (percentFields.some((f) => fieldName.includes(f))) {
                          return `${val}%`;
                        }
                        return val.toString();
                      }
                      return val;
                    };

                    // 基础条件（不包含时间周期）
                    const baseCondition = `${field}${operatorText}${formatValue(value, field)}`;

                    // 时间周期（如果存在）
                    let periodText = "";
                    if (period) {
                      const periodMap: { [key: string]: string } = {
                        "1y": "近一年",
                        "2y": "近两年",
                        "3y": "近三年",
                        "6m": "近6个月",
                        "1m": "近一个月",
                        "1w": "近一周",
                      };
                      periodText = periodMap[period] || period;
                    }

                    return {
                      baseCondition,
                      periodText,
                      hasTimePeriod: !!period,
                    };
                  };

                  const formatted = formatStructuredCondition(condition);
                  
                  return (
                    <div key={index} className="flex items-center gap-1">
                      {/* 时间周期标签（如果存在） */}
                      {formatted.hasTimePeriod && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                          {formatted.periodText}
                        </span>
                      )}
                      {/* 基础条件标签 */}
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {formatted.baseCondition}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI分析动画区域 - 独立显示 */}
          {isAiAnalyzing && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <AIAnalysisLoader 
                isVisible={isAiAnalyzing} 
                onComplete={handleAiAnalysisComplete}
                isApiComplete={isApiComplete}
              />
            </div>
          )}

          {/* 推荐股票区域 - 紧跟在关键词后面 */}
          {showResults && recommendedStocks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    推荐股票
                  </h4>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共推荐 {recommendedStocks.length} 只股票
                </span>
              </div>

              {/* 显示筛选条件 */}
              {structuredConditions.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      基于以下条件筛选：
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {structuredConditions.map((condition, index) => {
                      // 格式化结构化条件显示
                      const formatStructuredCondition = (condition: any) => {
                        const { field, operator, value, period } = condition;

                        // 操作符映射
                        const operatorMap: { [key: string]: string } = {
                          ">": " > ",
                          "<": " < ",
                          ">=": " ≥ ",
                          "<=": " ≤ ",
                          "=": " = ",
                          "!=": " ≠ ",
                          between: " 介于 ",
                          in: " 属于 ",
                        };

                        const operatorText = operatorMap[operator] || ` ${operator} `;

                        // 格式化数值（如果是百分比相关的字段，添加%符号）
                        const formatValue = (val: any, fieldName: string) => {
                          if (typeof val === "number") {
                            const percentFields = [
                              "收益率",
                              "回撤",
                              "最大回撤",
                              "毛利率",
                              "股息率",
                              "ROE",
                            ];
                            if (percentFields.some((f) => fieldName.includes(f))) {
                              return `${val}%`;
                            }
                            return val.toString();
                          }
                          return val;
                        };

                        // 基础条件（不包含时间周期）
                        const baseCondition = `${field}${operatorText}${formatValue(value, field)}`;

                        // 时间周期（如果存在）
                        let periodText = "";
                        if (period) {
                          const periodMap: { [key: string]: string } = {
                            "1y": "近一年",
                            "2y": "近两年",
                            "3y": "近三年",
                            "6m": "近6个月",
                            "1m": "近一个月",
                            "1w": "近一周",
                          };
                          periodText = periodMap[period] || period;
                        }

                        return {
                          baseCondition,
                          periodText,
                          hasTimePeriod: !!period,
                        };
                      };

                      const formatted = formatStructuredCondition(condition);
                      
                      return (
                        <div key={index} className="flex items-center gap-1">
                          {/* 时间周期标签（如果存在） */}
                          {formatted.hasTimePeriod && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                              {formatted.periodText}
                            </span>
                          )}
                          {/* 基础条件标签 */}
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                            {formatted.baseCondition}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendedStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {stock.name}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {stock.symbol}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stock.price.toFixed(2)}
                          </span>
                          <span className={`text-sm font-medium ${
                            stock.changePercent >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">匹配度</span>
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {stock.matchScore}%
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddRecommendedStock(stock)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                        >
                          添加到选股
                        </button>
                      </div>
                    </div>

                    {/* 使用key-value格式动态渲染详细信息 */}
                    {stock.details && Object.keys(stock.details).length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        {Object.entries(stock.details).map(([key, value]) => {
                          // 特殊处理结构化条件值，突出显示
                          const isConditionValue = key.startsWith('实际');
                          
                          return (
                            <div key={key} className={isConditionValue ? 'col-span-2' : ''}>
                              <span className={`text-sm ${
                                isConditionValue 
                                  ? 'text-green-600 dark:text-green-400 font-medium' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {key}
                              </span>
                              <p className={`font-medium ${
                                isConditionValue 
                                  ? 'text-green-800 dark:text-green-200 text-lg' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {value}
                                {isConditionValue && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                    筛选条件
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">推荐理由</span>
                      <div className="flex flex-wrap gap-1">
                        {stock.matchReasons.map((reason, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 显示投资亮点和风险提示 */}
                    {stock.investmentHighlights && stock.investmentHighlights.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-blue-600 dark:text-blue-400 mb-2 block font-medium">投资亮点</span>
                        <div className="flex flex-wrap gap-1">
                          {stock.investmentHighlights.map((highlight, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {stock.riskWarnings && stock.riskWarnings.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-red-600 dark:text-red-400 mb-2 block font-medium">风险提示</span>
                        <div className="flex flex-wrap gap-1">
                          {stock.riskWarnings.map((warning, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs"
                            >
                              {warning}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* 已选择的股票列表 */}
      {positions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                已选择股票
              </h3>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              已选择 {positions.length} 只股票
            </span>
          </div>

          <div className="space-y-2">
            {positions.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stock.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {stock.sector && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {stock.sector}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveStock(stock.symbol)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* 建议区域 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
            <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              选股建议
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>• 建议选择不同行业的股票以分散风险</p>
              <p>• 关注股票的基本面指标，如PE、PB、ROE等</p>
              <p>• 考虑市场环境和宏观经济因素</p>
              <p>• 定期回顾和调整选股策略</p>
            </div>
          </div>
        </div>
      </div>

      {/* 统一操作按钮区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* 主要操作按钮 */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleSave}
              disabled={isCreatingStrategy || (isCreating && (!strategyName.trim() || !strategyDescription.trim()))}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="w-5 h-5" />
              <span>{isCreating ? '创建策略' : isOwnStrategy ? '保存配置' : '创建我的副本'}</span>
            </button>
          </div>

          {/* 次要操作按钮（仅在编辑模式显示） */}
          {!isCreating && (
            <>
              {/* 分隔线 */}
              <div className="border-t border-gray-200 dark:border-gray-600"></div>

              {/* 次要操作按钮 */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePublishToSquare}
                  disabled={strategyActions.isPublishing}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {strategyActions.isPublishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                  <span>{strategyActions.isPublishing ? '发布中...' : '发布到广场'}</span>
                </button>
                <button
                  onClick={handleShare}
                  disabled={strategyActions.isSharing}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {strategyActions.isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{strategyActions.isSharing ? '分享中...' : '分享'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default StockSelectionConfigPage;