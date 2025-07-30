import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useStore } from '../../hooks/useStore';
import { BacktestResults } from '../../components/backtest/BacktestResults';

const BacktestResultsPage: React.FC = observer(() => {
  const { strategy } = useStore();
  const navigate = useNavigate();

  if (!strategy.backtestResults) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">没有回测结果</div>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          返回首页
        </button>
      </div>
    );
  }

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <BacktestResults
      results={strategy.backtestResults}
      onBack={handleBack}
    />
  );
});

export default BacktestResultsPage;