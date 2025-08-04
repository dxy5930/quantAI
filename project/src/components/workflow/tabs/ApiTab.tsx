import React from 'react';
import { Code } from 'lucide-react';

export const ApiTab: React.FC = () => {
  return (
    <div className="p-4">
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>API 接口</p>
        <p className="text-sm">当前任务未涉及API调用</p>
      </div>
    </div>
  );
}; 