import React from 'react';
import { StockAnalysisCard } from './StockAnalysisCard';
import { StockRecommendation } from '../../types';

interface StockAnalysisCardContainerProps {
  stocks: StockRecommendation[];
  showDetailedAnalysis?: boolean;
  showTrendChart?: boolean;
  onViewDetails?: (symbol: string) => void;
  className?: string;
}

export const StockAnalysisCardContainer: React.FC<StockAnalysisCardContainerProps> = ({
  stocks,
  showDetailedAnalysis = false,
  showTrendChart = false,
  onViewDetails,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {stocks.map(stock => (
        <StockAnalysisCard
          key={stock.symbol}
          stock={stock}
          showDetailedAnalysis={showDetailedAnalysis}
          showTrendChart={showTrendChart}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

 