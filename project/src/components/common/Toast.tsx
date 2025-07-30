import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../hooks/useStore';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  timestamp: string;
}

interface ToastItemProps {
  notification: ToastNotification;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // 自动移除
    if (notification.duration && notification.duration > 0) {
      const removeTimer = setTimeout(() => {
        handleRemove();
      }, notification.duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(removeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [notification.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-2
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isRemoving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div
        className={`
          flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
          ${getBackgroundColor()}
          max-w-sm min-w-[320px]
        `}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            {notification.message}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/50 dark:hover:bg-black/20"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = observer(() => {
  const appStore = useAppStore();

  const handleRemove = (id: string) => {
    appStore.removeToastNotification(id);
  };

  if (appStore.toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {appStore.toastNotifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
});