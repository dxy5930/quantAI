import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCircle, XCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { useAppStore } from '../../hooks/useStore';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = observer(({ isOpen, onClose }) => {
  const appStore = useAppStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

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
    // 标记通知为已读
    appStore.markNotificationAsRead(notification.id);
    // 跳转到通知详情页面
    navigate(`/notification/${notification.id}`);
    // 关闭模态框
    onClose();
  };

  const handleClearAll = () => {
    appStore.markAllNotificationsAsRead();
  };

  const handleRemoveNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    appStore.removeNotification(id);
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 模态框 */}
      <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[80vh] flex flex-col animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">通知中心</h3>
            {appStore.unreadNotificationCount > 0 && (
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                {appStore.unreadNotificationCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {appStore.unreadNotificationCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
              >
                全部标记已读
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {appStore.unreadNotificationCount === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无通知</p>
              <p className="text-sm">您的通知消息将在这里显示</p>
            </div>
          ) : (
            <div className="p-2">
              {appStore.unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 mb-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border-l-4 cursor-pointer transition-all duration-300 ${getNotificationBorderColor(notification.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => handleRemoveNotification(notification.id, e)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 overflow-hidden" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical' 
                      }}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {appStore.unreadNotificationCount > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </>
  );
}); 