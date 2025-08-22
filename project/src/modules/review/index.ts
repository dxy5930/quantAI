/**
 * 复盘模块统一导出
 * Review Module Unified Exports
 */

// 组件导出
export { ReviewPage } from './components/ReviewPage';
export { ReviewEditor } from './components/ReviewEditor';
export { ReviewList } from './components/ReviewList';
export { StockInputModal } from './components/StockInputModal';
export { AISuggestions } from './components/AISuggestions';
export { StreamingAIGenerator } from './components/StreamingAIGenerator';

// 多维表格数据库功能
export * from './database';

// Hooks导出
export {
  useReviewData,
  useReviewAI,
  useReviewEditor,
  useReviewModals
} from './hooks';

// Services导出
export { reviewApiService } from './services/api';
export { reviewAIService } from './services/ai';

// 类型导出
export type {
  Review,
  ReviewCreateParams,
  ReviewUpdateParams,
  ReviewListResponse,
  StockPosition,
  ReviewContext,
  AIAnalysisResult,
  MarketData,
  MarketAnalysisResult,
  Suggestion,
  MarketSentimentIndicators,
  StreamingMessage,
  ReviewListProps,
  ReviewEditorProps,
  StockInputModalProps,
  AISuggestionsProps,
  StreamingAIGeneratorProps
} from './types';

// 默认导出主页面组件
export { ReviewPage as default } from './components/ReviewPage';