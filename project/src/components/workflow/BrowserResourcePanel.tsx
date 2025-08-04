import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  X,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  status: 'loading' | 'loaded' | 'error';
  screenshot?: string;
  content?: string;
  timestamp: Date;
}

interface BrowserResource {
  id: string;
  type: 'browser';
  tabs: BrowserTab[];
  activeTabId?: string;
}

interface BrowserResourcePanelProps {
  resource: BrowserResource;
}

export const BrowserResourcePanel: React.FC<BrowserResourcePanelProps> = observer(({
  resource
}) => {
  const [activeTab, setActiveTab] = useState(resource.activeTabId || resource.tabs[0]?.id);

  const currentTab = resource.tabs.find(tab => tab.id === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'loaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标签页列表 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {resource.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {getStatusIcon(tab.status)}
              <span className="text-sm font-medium truncate max-w-[120px]">
                {tab.title}
              </span>
              {tab.status === 'loading' && (
                <RefreshCw className="w-3 h-3 animate-spin" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 当前标签页内容 */}
      {currentTab && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 地址栏 */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
                  {currentTab.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentTab.url}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">
                  {formatTime(currentTab.timestamp)}
                </span>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                  title="在新窗口打开"
                >
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                  title="刷新"
                >
                  <RefreshCw className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* 网页内容 */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {currentTab.status === 'loading' ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center space-x-2 text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>正在加载...</span>
                </div>
              </div>
            ) : currentTab.status === 'error' ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-red-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">页面加载失败</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 网页截图预览 */}
                {currentTab.screenshot && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={currentTab.screenshot} 
                      alt="页面截图"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                {/* 网页内容预览 */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    页面内容预览
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {currentTab.content || '内容获取中...'}
                  </div>
                </div>
                
                {/* 页面信息 */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">状态</div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(currentTab.status)}
                      <span className="text-gray-600 dark:text-gray-400">
                        {currentTab.status === 'loaded' ? '已加载' : 
                         currentTab.status === 'loading' ? '加载中' : '加载失败'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">更新时间</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatTime(currentTab.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default BrowserResourcePanel; 