import React from 'react';

export interface ChannelOption {
  id: string;
  name: string;
  streamUrl: string; // 播放源
  room?: string;     // 聊天房间
  teacherId?: string | null; // 所属老师
}

interface ChannelTabsProps {
  channels: ChannelOption[];
  activeId: string;
  onChange: (channel: ChannelOption) => void;
  className?: string;
}

export const ChannelTabs: React.FC<ChannelTabsProps> = ({ channels, activeId, onChange, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 mb-4 ${className}`}>
      {channels.map(ch => {
        const isActive = ch.id === activeId;
        return (
          <button
            key={ch.id}
            onClick={() => onChange(ch)}
            className={
              `px-3 py-1.5 rounded-lg border text-sm transition-all ` +
              (isActive
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700')
            }
          >
            {ch.name}
          </button>
        );
      })}
    </div>
  );
};

export default ChannelTabs; 