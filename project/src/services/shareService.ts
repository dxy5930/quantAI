import { strategyApi } from './api/strategyApi';
import { stockSelectionApi } from './api/stockSelectionApi';

/**
 * 分享结果接口
 */
export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  error?: string;
}

/**
 * 分享配置接口
 */
export interface ShareConfig {
  strategyId: string;
  strategyName?: string;
  onSuccess?: (shareUrl: string) => void;
  onError?: (error: string) => void;
}

/**
 * 统一的分享服务类
 */
class ShareService {
  /**
   * 分享策略
   * @param config 分享配置
   * @returns 分享结果
   */
  async shareStrategy(config: ShareConfig): Promise<ShareResult> {
    const { strategyId, strategyName, onSuccess, onError } = config;

    if (!strategyId) {
      const error = '策略ID不能为空';
      onError?.(error);
      return { success: false, error };
    }

    try {
      // 优先使用策略API生成分享链接
      let result = await this.tryGenerateShareLink(strategyId);
      
      // 如果失败，尝试选股API
      if (!result.success) {
        result = await this.tryGenerateShareLinkFromSelection(strategyId);
      }

      // 如果都失败，使用兜底方案
      if (!result.success) {
        result = this.generateFallbackShareLink(strategyId);
      }

      if (result.success && result.shareUrl) {
        // 复制到剪贴板
        await navigator.clipboard.writeText(result.shareUrl);
        
        const successMessage = `${strategyName || '策略'}的分享链接已复制到剪贴板`;
        onSuccess?.(result.shareUrl);
        
        console.log(successMessage, result.shareUrl);
        return { success: true, shareUrl: result.shareUrl };
      } else {
        throw new Error(result.error || '生成分享链接失败');
      }
    } catch (error: any) {
      const errorMessage = error.message || '分享失败，请重试';
      onError?.(errorMessage);
      console.error('分享失败:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 尝试通过策略API生成分享链接
   */
  private async tryGenerateShareLink(strategyId: string): Promise<ShareResult> {
    try {
      const result = await strategyApi.generateShareLink(strategyId);
      if (result.success && result.data?.shareUrl) {
        return { success: true, shareUrl: result.data.shareUrl };
      }
      return { success: false, error: result.message || '策略API生成失败' };
    } catch (error: any) {
      return { success: false, error: error.message || '策略API调用失败' };
    }
  }

  /**
   * 尝试通过选股API生成分享链接
   */
  private async tryGenerateShareLinkFromSelection(strategyId: string): Promise<ShareResult> {
    try {
      const result = await stockSelectionApi.generateShareLink(strategyId);
      if (result.success && result.data?.shareUrl) {
        return { success: true, shareUrl: result.data.shareUrl };
      }
      return { success: false, error: result.message || '选股API生成失败' };
    } catch (error: any) {
      return { success: false, error: error.message || '选股API调用失败' };
    }
  }

  /**
   * 生成兜底分享链接
   */
  private generateFallbackShareLink(strategyId: string): ShareResult {
    try {
      const shareUrl = `${window.location.origin}/strategy-square/${strategyId}`;
      return { success: true, shareUrl };
    } catch (error: any) {
      return { success: false, error: '生成兜底链接失败' };
    }
  }

  /**
   * 快速分享 - 带有统一的成功/错误提示
   * @param strategyId 策略ID
   * @param strategyName 策略名称
   * @param showMessage 显示消息的函数
   * @returns 分享结果
   */
  async quickShare(
    strategyId: string, 
    strategyName?: string,
    showMessage?: { success: (msg: string) => void; error: (msg: string) => void }
  ): Promise<ShareResult> {
    return this.shareStrategy({
      strategyId,
      strategyName,
      onSuccess: (shareUrl) => {
        showMessage?.success('分享链接已复制到剪贴板');
      },
      onError: (error) => {
        showMessage?.error(error);
      }
    });
  }

  /**
   * 检查是否支持剪贴板API
   */
  isClipboardSupported(): boolean {
    return !!navigator.clipboard && !!navigator.clipboard.writeText;
  }

  /**
   * 手动复制文本（兜底方案）
   */
  fallbackCopyText(text: string): boolean {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      console.error('兜底复制失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const shareService = new ShareService();

// 导出便捷方法
export const shareStrategy = shareService.shareStrategy.bind(shareService);
export const quickShare = shareService.quickShare.bind(shareService); 