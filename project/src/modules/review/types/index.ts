/**
 * 复盘模块类型定义
 * Review Module Type Definitions
 */

export interface Review {
  id: string;
  reviewId?: string;
  title: string;
  date: any;
  status: 'draft' | 'completed';
  summary?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewDate?: string;
}

export interface ReviewCreateParams {
  title?: string;
  reviewDate?: string;
}

export interface ReviewUpdateParams {
  title?: string;
  summary?: string;
  status?: 'draft' | 'completed';
  content?: string;
  reviewDate?: string;
}

export interface ReviewListResponse {
  total: number;
  items: Review[];
}

// AI相关类型
export interface StockPosition {
  symbol: string;
  name: string;
  buyPrice: number;
  sellPrice?: number;
  quantity: number;
  profit?: number;
  profitRate?: number;
}

export interface ReviewContext {
  reviewId: string;
  title: string;
  date: string;
  positions?: StockPosition[];
  marketCondition?: 'bull' | 'bear' | 'sideways';
  personalNotes?: string;
}

export interface AIAnalysisResult {
  content: string;
  summary?: string;
  confidence?: number;
  suggestions?: string[];
}

export interface MarketData {
  date: string;
  indices: {
    name: string;
    current: number;
    change: number;
    changePercent: number;
  }[];
  volume: {
    total: number;
    changePercent: number;
  };
  sentiment: 'bullish' | 'bearish' | 'neutral';
  hotSectors: string[];
  news: {
    title: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export interface MarketAnalysisResult {
  summary: string;
  analysis: string;
  keyPoints: string[];
  sentiment: string;
  recommendations: string[];
}

// AI建议相关类型
export interface Suggestion {
  id: string;
  type: 'strategy' | 'risk' | 'learning' | 'action';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface MarketSentimentIndicators {
  overall: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  factors: string[];
}

// 流式AI消息类型
export interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// 组件Props类型
export interface ReviewListProps {
  reviews: Review[];
  selectedReview: Review | null;
  onSelectReview: (review: Review) => void;
  onCreateReview: () => void;
  onDeleteReview: (reviewId: string) => void;
}

export interface ReviewEditorProps {
  review: Review | null;
  onUpdateReview: (reviewId: string, updates: Partial<Review>) => void;
}

export interface StockInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (positions: StockPosition[]) => void;
}

export interface AISuggestionsProps {
  review: {
    id: string;
    title: string;
    date: string;
    content?: string;
    summary?: string;
  } | null;
  isVisible: boolean;
  onClose: () => void;
}

export interface StreamingAIGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onContentGenerated: (content: string) => void;
  reviewContext: {
    id: string;
    title: string;
    date: string;
    summary?: string;
    content?: string;
  } | null;
}