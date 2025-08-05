import React from 'react';
import { observer } from 'mobx-react-lite';

import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  X,
} from 'lucide-react';
import { useAppStore } from '../../hooks/useStore';

export const NotificationCenter: React.FC = observer(() => {
  const appStore = useAppStore();


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-400';
      case 'error':
        return 'border-l-red-400';
      case 'warning':
        return 'border-l-yellow-400';
      case 'info':
        return 'border-l-blue-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleNotificationClick = (notification: any) => {
    // 标记为已读
    appStore.markNotificationAsRead(notification.id);
    
    // 不再导航到详情页面，只是标记为已读
    // 可以在这里添加其他处理逻辑，比如显示模态框等
  };

  const handleClearAll = () => {
    appStore.markAllNotificationsAsRead();
  };

  const handleRemoveNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    appStore.removeNotification(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
           
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  通知中心
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  管理您的所有通知消息
                </p>
              </div>
            </div>
          </div>
          
          {appStore.unreadNotificationCount > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              全部标记为已读
            </button>
          )}
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">总通知</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appStore.notifications.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">未读通知</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appStore.unreadNotificationCount}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">已读通知</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appStore.notifications.length - appStore.unreadNotificationCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              所有通知
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {appStore.notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
                <Bell className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-medium">暂无通知</p>
                <p className="text-sm">您的通知消息将在这里显示</p>
              </div>
            ) : (
              appStore.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${getNotificationBorderColor(
                    notification.type
                  )} ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <button
                            onClick={(e) => handleRemoveNotification(notification.id, e)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}); 