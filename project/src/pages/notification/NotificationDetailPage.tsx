import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Bell, Clock, CheckCircle, XCircle, AlertTriangle, Info, ExternalLink, Trash2 } from 'lucide-react';
import { useAppStore } from '../../hooks/useStore';
import { BackButton, StickyNavigationBar } from '../../components';

const NotificationDetailPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appStore = useAppStore();
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const foundNotification = appStore.notifications.find(n => n.id === id);
      setNotification(foundNotification);
    }
  }, [id, appStore.notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case 'info':
        return <Info className="w-8 h-8 text-blue-400" />;
      default:
        return <Bell className="w-8 h-8 text-gray-400" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'success':
        return '成功';
      case 'error':
        return '错误';
      case 'warning':
        return '警告';
      case 'info':
        return '信息';
      default:
        return '通知';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30';
      case 'error':
        return 'bg-red-900/20 border-red-500/30';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'info':
        return 'bg-blue-900/20 border-blue-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };



  const handleDelete = () => {
    if (notification && window.confirm('确定要删除这条通知吗？')) {
      appStore.removeNotification(notification.id);
      navigate(-1);
    }
  };

  const handleMarkAsUnread = () => {
    if (notification) {
      // 使用AppStore的方法来标记通知为未读
      appStore.markNotificationAsUnread(notification.id);
      navigate(-1);
    }
  };

  const handleActionClick = () => {
    if (notification?.link) {
      navigate(notification.link);
    } else {
      // 根据通知分类或内容决定跳转到哪个页面
      switch (notification?.category) {

        case 'strategy':
          navigate(ROUTES.HOME);
          break;
        case 'ranking':
          navigate(ROUTES.RANKING);
          break;
        case 'user':
          navigate(ROUTES.SETTINGS);
          break;
        default:
          // 根据消息内容推断跳转页面
          if (notification?.message.includes('策略')) {
            navigate(ROUTES.HOME);
          } else if (notification?.message.includes('用户') || notification?.message.includes('账户')) {
            navigate(ROUTES.SETTINGS);
          } else if (notification?.message.includes('排行') || notification?.message.includes('排名')) {
            navigate(ROUTES.RANKING);
          }
          break;
      }
    }
  };

  if (!notification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">通知不存在</h2>
          <p className="text-gray-400 mb-6">您要查看的通知可能已被删除或不存在</p>
          <BackButton 
            text="返回上一页"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 粘性导航条 */}
      <StickyNavigationBar
        title={notification?.title || '通知详情'}
      />
      
      <div className="max-w-4xl mx-auto space-y-6">
      {/* 头部导航 */}
      <div className="flex items-center justify-between">
        <BackButton 
          variant="minimal"
          className="text-gray-400 hover:text-white"
        />
        
        <div className="flex items-center space-x-2">
          {notification?.read && (
            <button
              onClick={handleMarkAsUnread}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>标记为未读</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
      </div>

      {/* 通知详情卡片 */}
      <div className={`bg-gray-800 rounded-xl p-8 border-2 ${getNotificationBgColor(notification.type)}`}>
        {/* 通知头部 */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{notification.title}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                notification.type === 'success' ? 'bg-green-600/20 text-green-400' :
                notification.type === 'error' ? 'bg-red-600/20 text-red-400' :
                notification.type === 'warning' ? 'bg-yellow-600/20 text-yellow-400' :
                'bg-blue-600/20 text-blue-400'
              }`}>
                {getNotificationTypeLabel(notification.type)}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(notification.timestamp)}</span>
              </div>
              {notification.category && (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="capitalize">{notification.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 通知内容 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">详细信息</h2>
          <div className="bg-gray-700/50 rounded-lg p-6">
            <p className="text-gray-300 leading-relaxed text-base">
              {notification.message}
            </p>
          </div>
        </div>

        {/* 相关信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">通知ID</h3>
            <p className="text-white font-mono text-sm">{notification.id}</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">持续时间</h3>
            <p className="text-white">{notification.duration ? `${notification.duration / 1000}秒` : '永久'}</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {(notification.link || notification.category) && (
            <button
              onClick={handleActionClick}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>查看相关内容</span>
            </button>
          )}
          
          <BackButton 
            text="返回"
            className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          />
        </div>
      </div>

      {/* 相关建议 */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">相关建议</h2>
        <div className="space-y-3">
          {notification.type === 'success' && (
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300">操作已成功完成，您可以继续进行下一步操作。</p>
              </div>
            </div>
          )}
          
          {notification.type === 'error' && (
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300">如果问题持续存在，请联系客服或查看帮助文档。</p>
              </div>
            </div>
          )}
          
          {notification.type === 'warning' && (
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300">请注意相关风险，建议在操作前仔细阅读相关说明。</p>
              </div>
            </div>
          )}
          
          {notification.type === 'info' && (
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-300">了解更多信息，请查看相关文档或联系支持团队。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
});

export default NotificationDetailPage; 