import React, { useState } from "react";
import { Save, Share2, Upload, Copy, Check } from "lucide-react";
import { useResponsive } from "../../hooks/useResponsive";

interface ActionButtonsProps {
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
  disabled?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSave,
  onPublish,
  onShare,
  isSaving = false,
  isPublishing = false,
  disabled = false,
  className = "",
  layout,
  size = 'md',
  fullWidth = false,
}) => {
  const [shareClicked, setShareClicked] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  // 自动确定布局方向
  const actualLayout = layout || (isMobile ? 'vertical' : 'horizontal');
  
  // 确定按钮大小
  const buttonSize = size === 'sm' ? 'px-3 py-1.5 text-sm' : 
                    size === 'lg' ? 'px-6 py-3 text-base' : 
                    'px-4 py-2 text-sm';

  const handleShare = async () => {
    if (onShare) {
      setShareClicked(true);
      await onShare();

      // 2秒后重置状态
      setTimeout(() => {
        setShareClicked(false);
      }, 2000);
    }
  };

  const containerClasses = `
    ${actualLayout === 'vertical' ? 'flex flex-col space-y-2' : 'flex items-center space-x-2 lg:space-x-3'}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const buttonBaseClasses = `
    flex items-center justify-center space-x-2 
    ${buttonSize}
    ${fullWidth && actualLayout === 'vertical' ? 'w-full' : ''}
    rounded-lg transition-all duration-300 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isMobile ? 'min-h-[44px]' : ''}
  `.trim();

  return (
    <div className={containerClasses}>
      {/* 保存按钮 */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={disabled || isSaving}
          className={`${buttonBaseClasses} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-900 dark:text-white">保存中...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">保存</span>
            </>
          )}
        </button>
      )}

      {/* 发布按钮 */}
      {onPublish && (
        <button
          onClick={onPublish}
          disabled={disabled || isPublishing}
          className={`${buttonBaseClasses} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-md hover:shadow-lg`}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>发布中...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className={isMobile ? 'text-xs' : ''}>发布到广场</span>
            </>
          )}
        </button>
      )}

      {/* 分享按钮 */}
      {onShare && (
        <button
          onClick={handleShare}
          disabled={disabled}
          className={`${buttonBaseClasses} bg-green-600 hover:bg-green-500 disabled:bg-gray-400 text-white shadow-md hover:shadow-lg`}
        >
          {shareClicked ? (
            <>
              <Check className="w-4 h-4" />
              <span>已复制链接</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

// 分享模态框组件
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  strategyName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  strategyName,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          分享策略: {strategyName}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分享链接
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">复制</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            其他用户点击此链接后可以查看策略详情页面
          </p>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
