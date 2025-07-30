import React, { useState, useRef } from "react";
import Modal from "./Modal";
import { Settings, History, User, Bell } from "lucide-react";

const PopoverExample: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Popover 示例</h2>
      
      {/* 演示不同位置的 popover */}
      <div className="flex items-center justify-center space-x-8 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {/* 顶部 popover */}
        <button
          ref={settingsButtonRef}
          onClick={() => setShowSettings(true)}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* 底部 popover */}
        <button
          ref={historyButtonRef}
          onClick={() => setShowHistory(true)}
          className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <History className="w-5 h-5" />
        </button>

        {/* 左侧 popover */}
        <button
          ref={profileButtonRef}
          onClick={() => setShowProfile(true)}
          className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <User className="w-5 h-5" />
        </button>

        {/* 右侧 popover */}
        <button
          ref={notificationsButtonRef}
          onClick={() => setShowNotifications(true)}
          className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Popover - 顶部显示 */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="设置"
        mode="popover"
        triggerElement={settingsButtonRef.current}
        position="top"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">暗色主题</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">消息通知</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">自动保存</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
        </div>
      </Modal>

      {/* History Popover - 底部显示 */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="最近操作"
        mode="popover"
        triggerElement={historyButtonRef.current}
        position="bottom"
      >
        <div className="space-y-2">
          <div className="text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            创建了新工作流
          </div>
          <div className="text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            运行了策略分析
          </div>
          <div className="text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            保存了配置
          </div>
        </div>
      </Modal>

      {/* Profile Popover - 左侧显示 */}
      <Modal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="用户信息"
        mode="popover"
        triggerElement={profileButtonRef.current}
        position="left"
      >
        <div className="space-y-3">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-2"></div>
            <p className="font-medium">用户名</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">user@example.com</p>
          </div>
          <div className="border-t pt-3">
            <button className="w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              编辑资料
            </button>
            <button className="w-full text-left text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              退出登录
            </button>
          </div>
        </div>
      </Modal>

      {/* Notifications Popover - 右侧显示 */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="通知"
        mode="popover"
        triggerElement={notificationsButtonRef.current}
        position="right"
      >
        <div className="space-y-2">
          <div className="text-sm p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="font-medium">工作流已完成</p>
            <p className="text-gray-600 dark:text-gray-400">2分钟前</p>
          </div>
          <div className="text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <p className="font-medium">数据同步成功</p>
            <p className="text-gray-600 dark:text-gray-400">10分钟前</p>
          </div>
          <div className="text-sm p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <p className="font-medium">系统维护通知</p>
            <p className="text-gray-600 dark:text-gray-400">1小时前</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PopoverExample; 