/**
 * 复盘编辑器组件 - 模块化版本
 * Review Editor Component - Modular Version
 */

import React, { useEffect } from 'react';
import { Save, Edit3, Calendar, FileText, TrendingUp, TrendingDown, DollarSign, Sparkles, Bot, Loader2, Lightbulb, MessageCircle } from 'lucide-react';
import { useReviewEditor, useReviewAI, useReviewModals } from '../hooks';
import { ReviewEditorProps, StockPosition, ReviewContext } from '../types';
import StockInputModal from './StockInputModal';
import AISuggestions from './AISuggestions';
import StreamingAIGenerator from './StreamingAIGenerator';

export const ReviewEditor: React.FC<ReviewEditorProps> = ({
  review,
  onUpdateReview
}) => {
  // 使用模块化的Hooks
  const {
    isEditing,
    title,
    content,
    summary,
    setTitle,
    setContent,
    setSummary,
    save,
    startEdit,
    cancelEdit,
    appendContent,
  } = useReviewEditor(review, onUpdateReview);

  const {
    loading: aiLoading,
    generateFullReview,
    analyzeStockPerformance,
    analyzeMarketCondition,
    generateInvestmentSuggestions,
  } = useReviewAI();

  const {
    showStockModal,
    showAISuggestions,
    showStreamingAI,
    showAIOptions,
    openStockModal,
    closeStockModal,
    openAISuggestions,
    closeAISuggestions,
    openStreamingAI,
    closeStreamingAI,
    toggleAIOptions,
    closeAIOptions,
  } = useReviewModals();

  // 点击外部关闭AI选项菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAIOptions) {
        const target = event.target as Element;
        if (!target.closest('.ai-options-container')) {
          closeAIOptions();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAIOptions, closeAIOptions]);

  // AI智能生成功能
  const handleAIGenerate = async (generateType: 'full' | 'market' | 'analysis' | 'suggestions') => {
    if (!review) return;
    
    // 如果是股票分析，显示股票输入模态框
    if (generateType === 'analysis') {
      openStockModal();
      closeAIOptions();
      return;
    }
    
    closeAIOptions();
    
    try {
      const reviewContext: ReviewContext = {
        reviewId: review.id,
        title: title || review.title,
        date: review.date,
        personalNotes: summary
      };

      let result;
      
      switch (generateType) {
        case 'full':
          result = await generateFullReview(reviewContext);
          if (result) {
            setContent(result.content);
            if (result.summary) {
              setSummary(result.summary);
            }
          }
          break;
          
        case 'market':
          result = await analyzeMarketCondition(review.date);
          if (result) {
            appendContent(`## AI市场分析\n\n${result.content}`);
          }
          break;
          
        case 'suggestions':
          result = await generateInvestmentSuggestions(reviewContext);
          if (result) {
            appendContent(`## AI智能建议\n\n${result.content}`);
          }
          break;
      }
      
    } catch (error) {
      console.error('AI生成失败:', error);
      alert(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理股票分析
  const handleStockAnalysis = async (positions: StockPosition[]) => {
    if (!review) return;
    
    try {
      const result = await analyzeStockPerformance(positions);
      if (result) {
        appendContent(`## AI持仓分析\n\n${result.content}`);
      }
    } catch (error) {
      console.error('股票分析失败:', error);
      alert(`股票分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理流式AI生成的内容
  const handleStreamingAIContent = (generatedContent: string) => {
    if (isEditing) {
      appendContent(generatedContent);
    } else {
      startEdit();
      setTimeout(() => {
        appendContent(generatedContent);
      }, 100);
    }
  };

  if (!review) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            选择一个复盘开始编辑
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            从左侧列表选择已有复盘，或创建新的复盘记录
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              {review.date}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              review.status === 'completed' 
                ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                : 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
            }`}>
              {review.status === 'completed' ? '已完成' : '草稿'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                {/* AI智能生成按钮 */}
                <div className="relative ai-options-container">
                  <button
                    onClick={toggleAIOptions}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{aiLoading ? 'AI生成中...' : 'AI智能生成'}</span>
                  </button>
                  
                  {/* AI选项菜单 */}
                  {showAIOptions && (
                    <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleAIGenerate('full')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                        >
                          <Bot className="w-4 h-4 text-purple-500" />
                          <span>生成完整复盘</span>
                        </button>
                        <button
                          onClick={() => handleAIGenerate('market')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                        >
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span>市场概况分析</span>
                        </button>
                        <button
                          onClick={() => handleAIGenerate('analysis')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                        >
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span>持仓分析</span>
                        </button>
                        <button
                          onClick={() => handleAIGenerate('suggestions')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4 text-yellow-500" />
                          <span>智能建议</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={save}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openStreamingAI}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="与AI对话生成内容"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>AI对话</span>
                </button>
                <button
                  onClick={openAISuggestions}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="获取AI智能建议"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>AI建议</span>
                </button>
                <button
                  onClick={startEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 标题编辑 */}
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-4 text-2xl font-bold bg-transparent border-b-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="输入复盘标题..."
          />
        ) : (
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
        )}
      </div>

      {/* 编辑/预览区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              {/* 摘要编辑 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  复盘摘要
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="简要描述本次复盘的主要内容..."
                />
              </div>

              {/* 内容编辑 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  复盘内容 (支持 Markdown)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={30}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                  placeholder="在这里编写详细的复盘内容..."
                />
              </div>
            </div>
          ) : (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {/* 摘要显示 */}
              {summary && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    复盘摘要
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 m-0">{summary}</p>
                </div>
              )}

              {/* 内容预览 */}
              <div className="text-gray-900 dark:text-gray-100 leading-relaxed space-y-6">
                {content.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{line.slice(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">{line.slice(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">{line.slice(4)}</h3>;
                  } else if (line.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start ml-4">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{line.slice(2)}</span>
                      </div>
                    );
                  } else if (line.startsWith('1. ') || /^\d+\. /.test(line)) {
                    return <div key={index} className="ml-4">{line}</div>;
                  } else if (line.startsWith('*') && line.endsWith('*')) {
                    return <p key={index} className="text-sm text-gray-600 dark:text-gray-400 italic text-center mt-8">{line.slice(1, -1)}</p>;
                  } else if (line.startsWith('---')) {
                    return <hr key={index} className="my-8 border-gray-300 dark:border-gray-600" />;
                  } else if (line.trim() === '') {
                    return <div key={index} className="h-4" />;
                  } else {
                    return <p key={index} className="mb-4">{line}</p>;
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模态框组件 */}
      <StockInputModal
        isOpen={showStockModal}
        onClose={closeStockModal}
        onConfirm={handleStockAnalysis}
      />

      <AISuggestions
        review={review}
        isVisible={showAISuggestions}
        onClose={closeAISuggestions}
      />

      <StreamingAIGenerator
        isOpen={showStreamingAI}
        onClose={closeStreamingAI}
        onContentGenerated={handleStreamingAIContent}
        reviewContext={review ? {
          id: review.id,
          title: review.title,
          date: review.date,
          summary: review.summary,
          content: review.content
        } : null}
      />
    </div>
  );
};

export default ReviewEditor;