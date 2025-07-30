/**
 * 分享策略 - 生成 shareId 并复制策略详情页链接到剪贴板
 * @param strategyId 策略ID
 * @param strategyName 策略名称（可选，用于提示信息）
 * @param generateShareLink 生成分享链接的API函数
 * @returns Promise<{success: boolean, shareUrl?: string, error?: string}> 分享结果
 */
export const shareStrategy = async (
  strategyId: string,
  strategyName?: string,
  generateShareLink?: (id: string) => Promise<any>
): Promise<{success: boolean, shareUrl?: string, error?: string}> => {
  if (!strategyId) {
    return { success: false, error: '策略ID不能为空' };
  }

  try {
    let shareUrl: string;

    if (generateShareLink) {
      // 调用API生成shareId和分享链接
      const result = await generateShareLink(strategyId);
      
      if (result.success && result.data?.shareUrl) {
        shareUrl = result.data.shareUrl;
      } else {
        return { success: false, error: result.message || '生成分享链接失败' };
      }
    } else {
      // 兜底方案：直接使用策略ID生成链接
      shareUrl = `${window.location.origin}/strategy/${strategyId}`;
    }
    
    // 复制到剪贴板
    await navigator.clipboard.writeText(shareUrl);
    
    console.log(`${strategyName || '策略'}的分享链接已复制:`, shareUrl);
    return { success: true, shareUrl };
  } catch (error: any) {
    console.error('分享失败:', error);
    return { success: false, error: error.message || '复制链接失败' };
  }
};

/**
 * 分享策略（带成功/失败回调）
 * @param strategyId 策略ID
 * @param options 选项
 * @returns Promise<void>
 */
export const shareStrategyWithCallback = async (
  strategyId: string,
  options?: {
    strategyName?: string;
    generateShareLink?: (id: string) => Promise<any>;
    onSuccess?: (shareUrl?: string) => void;
    onError?: (error: string) => void;
  }
): Promise<void> => {
  const result = await shareStrategy(
    strategyId, 
    options?.strategyName, 
    options?.generateShareLink
  );
  
  if (result.success) {
    options?.onSuccess?.(result.shareUrl);
  } else {
    options?.onError?.(result.error || '复制链接失败，请重试');
  }
}; 