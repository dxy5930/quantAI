import React from 'react';
import { observer } from 'mobx-react-lite';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelRightClose, 
  PanelRightOpen,
  Play,
  Save,
  Undo,
  Redo,
  Settings,
  Plus
} from 'lucide-react';

interface WorkflowToolbarProps {
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  isLeftPanelCollapsed: boolean;
  isRightPanelCollapsed: boolean;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = observer(({
  onToggleLeftPanel,
  onToggleRightPanel,
  isLeftPanelCollapsed,
  isRightPanelCollapsed
}) => {
  return (
    <div className="h-12 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* 左侧控制 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleLeftPanel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title={isLeftPanelCollapsed ? "显示工作流列表" : "隐藏工作流列表"}
        >
          {isLeftPanelCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* 中间空白区域 */}
      <div className="flex-1"></div>

      {/* 右侧控制 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleRightPanel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title={isRightPanelCollapsed ? "显示工作空间" : "隐藏工作空间"}
        >
          {isRightPanelCollapsed ? (
            <PanelRightOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <PanelRightClose className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
});

export default WorkflowToolbar; 