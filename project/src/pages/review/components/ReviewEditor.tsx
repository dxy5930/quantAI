import React, { useState, useEffect } from 'react';
import { Save, Edit3, Eye, Calendar, FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Review {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'completed';
  summary?: string;
}

interface ReviewEditorProps {
  review: Review | null;
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
}

export const ReviewEditor: React.FC<ReviewEditorProps> = ({
  review,
  onUpdateReview
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (review) {
      setTitle(review.title);
      setSummary(review.summary || '');
      setContent(`# ${review.title}

## 市场概况
今日市场表现...

## 持仓分析
### 盈利股票
- 股票A: +2.5%
- 股票B: +1.8%

### 亏损股票
- 股票C: -1.2%
- 股票D: -0.8%

## 交易决策回顾
### 买入决策
1. **股票A** - 技术面突破，基本面良好
2. **股票B** - 板块轮动机会

### 卖出决策
1. **股票C** - 止损出局
2. **股票D** - 获利了结

## 经验总结
### 做得好的地方
- 及时止损，控制风险
- 抓住了板块轮动机会

### 需要改进的地方
- 仓位管理需要更加精细
- 对市场情绪的判断还需提高

## 明日策略
- 关注大盘走势
- 重点关注科技板块
- 控制仓位在70%以内

## 风险提示
- 市场波动较大，注意风险控制
- 关注政策面变化

---
*复盘完成时间: ${new Date().toLocaleString()}*`);
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setSummary('');
    }
  }, [review]);

  const handleSave = () => {
    if (!review) return;
    
    onUpdateReview(review.id, {
      title,
      summary,
      status: 'completed'
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
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
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>编辑</span>
              </button>
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
    </div>
  );
};

export default ReviewEditor; 