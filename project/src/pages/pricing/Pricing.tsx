import React from 'react';
import { DollarSign } from 'lucide-react';

const PricingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            价格方案
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          选择适合您的订阅计划
        </p>
      </div>
    </div>
  );
};

export default PricingPage;