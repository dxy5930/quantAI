import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { pythonApiClient } from '../../services/pythonApiClient';

interface ApiStatusProps {
  className?: string;
}

export const PythonApiStatus: React.FC<ApiStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkApiStatus = async () => {
    setStatus('checking');
    try {
      const isHealthy = await pythonApiClient.healthCheck();
      setStatus(isHealthy ? 'connected' : 'disconnected');
      setLastCheck(new Date());
    } catch (error) {
      console.error('API status check failed:', error);
      setStatus('disconnected');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // 每30秒检查一次
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return '检查中...';
      case 'connected':
        return 'Python API 已连接';
      case 'disconnected':
        return 'Python API 未连接';
      default:
        return '状态未知';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {lastCheck && (
        <span className="text-xs opacity-75">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={checkApiStatus}
        className="text-xs underline hover:no-underline"
        disabled={status === 'checking'}
      >
        重新检查
      </button>
    </div>
  );
};

export default PythonApiStatus; 