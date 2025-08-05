import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useTheme } from '../../hooks/useTheme';
import { Settings, Moon, Sun, Bell, Shield, Database, LogOut } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const SettingsPage: React.FC = observer(() => {
  const { app, user } = useStore();
  const { theme, setLightTheme, setDarkTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await user.logout();
      app.showSuccess('已成功登出');
    } catch (error) {
      app.showError('登出失败，请重试');
    }
  };

  const handleChangePassword = () => {
    navigate(ROUTES.CHANGE_PASSWORD);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
          <Settings className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
      </div>

      {/* 外观设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
            <Moon className="h-5 w-5 text-white" />
          </div>
          <span>外观设置</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">主题模式</label>
              <p className="text-gray-600 dark:text-gray-400 text-sm">选择您喜欢的界面主题</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">当前主题: {theme}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={setLightTheme}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  theme === 'light' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>浅色</span>
              </button>
              <button
                onClick={setDarkTheme}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>深色</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <span>通知设置</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">回测完成通知</label>
              <p className="text-gray-600 dark:text-gray-400 text-sm">当策略回测完成时发送通知</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">系统消息通知</label>
              <p className="text-gray-600 dark:text-gray-400 text-sm">接收系统重要消息和更新</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">邮件通知</label>
              <p className="text-gray-600 dark:text-gray-400 text-sm">通过邮件接收重要通知</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 隐私与安全 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span>隐私与安全</span>
        </h2>
        
        <div className="space-y-4">
          <button 
            onClick={handleChangePassword}
            className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 dark:text-white font-medium">修改密码</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">更改您的登录密码</div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">›</div>
            </div>
          </button>

          <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 dark:text-white font-medium">双因素认证</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">增强账户安全性</div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">›</div>
            </div>
          </button>

          <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 dark:text-white font-medium">登录设备管理</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">查看和管理已登录的设备</div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">›</div>
            </div>
          </button>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-2 rounded-lg">
            <Database className="h-5 w-5 text-white" />
          </div>
          <span>数据管理</span>
        </h2>
        
        <div className="space-y-4">
          <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 dark:text-white font-medium">导出数据</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">下载您的策略和回测数据</div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">›</div>
            </div>
          </button>

          <button className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-900 dark:text-white font-medium">清除缓存</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">清除本地缓存数据</div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">›</div>
            </div>
          </button>

          <button className="w-full text-left p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-600 dark:text-red-400 font-medium">删除账户</div>
                <div className="text-red-500 dark:text-red-300 text-sm">永久删除您的账户和所有数据</div>
              </div>
              <div className="text-red-500 dark:text-red-400">›</div>
            </div>
          </button>
        </div>
      </div>

      {/* 账户操作 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">账户操作</h2>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-xl"
        >
          <LogOut className="h-4 w-4" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
});

export default SettingsPage;