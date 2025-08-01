import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  showCloseButton?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  variant = 'warning',
  icon,
  showCloseButton = false
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          confirmBg: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-500',
          confirmBg: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case 'info':
        return {
          iconColor: 'text-blue-500',
          confirmBg: 'bg-blue-500 hover:bg-blue-600'
        };
      default:
        return {
          iconColor: 'text-yellow-500',
          confirmBg: 'bg-yellow-500 hover:bg-yellow-600'
        };
    }
  };

  const styles = getVariantStyles();
  const defaultIcon = <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />;

  const modalContent = (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center"
      style={{ 
        zIndex: 99999,
        margin: 0,
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl relative mx-auto"
        style={{
          maxWidth: '400px',
          width: '100%',
          minWidth: '320px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        {showCloseButton && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6">
          {/* 标题和图标 */}
          <div className="flex items-center space-x-3 mb-4">
            {icon || defaultIcon}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>

          {/* 消息内容 */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          {/* 按钮组 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white ${styles.confirmBg} rounded-md transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal; 