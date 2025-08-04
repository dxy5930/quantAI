import React from 'react';
import { Database } from 'lucide-react';

export const DatabaseTab: React.FC = () => {
  return (
    <div className="p-4">
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>数据库资源</p>
        <p className="text-sm">当前任务未涉及数据库操作</p>
      </div>
    </div>
  );
}; 