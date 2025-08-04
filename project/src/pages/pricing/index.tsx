import React from 'react';
import { Check, X, Star, Zap, Crown } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: '免费版',
      price: '¥0',
      period: '永久免费',
      description: '适合个人用户体验基础功能',
      features: [
        '基础回测功能',
        '5个策略模板',
        '历史数据查看',
        '基础图表分析',
        '社区支持'
      ],
      limitations: [
        '回测次数限制每日10次',
        '数据更新延迟24小时',
        '不支持实盘交易',
        '无AI分析功能'
      ],
      buttonText: '开始使用',
      buttonStyle: 'bg-gray-600 hover:bg-gray-700',
      popular: false
    },
    {
      name: '专业版',
      price: '¥299',
      period: '每月',
      description: '适合专业投资者和量化交易者',
      features: [
        '无限制回测',
        '50+策略模板',
        '实时数据更新',
        '高级图表分析',
        '优先客服支持',
        'AI工作流分析',
        '策略分享功能',
        '自定义指标'
      ],
      limitations: [],
      buttonText: '立即升级',
      buttonStyle: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      popular: true
    },
    {
      name: '企业版',
      price: '¥999',
      period: '每月',
      description: '适合机构投资者和量化团队',
      features: [
        '专业版所有功能',
        '无限团队成员',
        '私有策略库',
        'API接口访问',
        '专属客户经理',
        '定制化开发',
        '7x24小时支持',
        '数据导出功能',
        '风控管理系统'
      ],
      limitations: [],
      buttonText: '联系销售',
      buttonStyle: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            选择适合您的方案
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            FindValue 为不同需求的用户提供灵活的定价方案，从个人投资者到专业机构，我们都有合适的解决方案
          </p>
        </div>

        {/* 定价卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-400 scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              {/* 推荐标签 */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>最受欢迎</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* 方案名称和价格 */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* 功能列表 */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    包含功能
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 限制列表 */}
                {plan.limitations.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <X className="w-5 h-5 text-red-500 mr-2" />
                      使用限制
                    </h4>
                    <ul className="space-y-3">
                      {plan.limitations.map((limitation, limitationIndex) => (
                        <li key={limitationIndex} className="flex items-center text-gray-600 dark:text-gray-400">
                          <X className="w-4 h-4 text-red-500 mr-3 flex-shrink-0" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 按钮 */}
                <button
                  className={`w-full text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 常见问题 */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            常见问题
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                如何选择合适的方案？
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                个人投资者建议从免费版开始体验，专业投资者推荐专业版，机构用户建议选择企业版以获得完整的团队协作功能。
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                是否支持试用？
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                免费版永久免费使用基础功能，专业版和企业版都提供7天免费试用，无需绑定信用卡。
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                可以随时取消订阅吗？
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                是的，您可以随时取消订阅，取消后仍可使用至当前计费周期结束，不会产生额外费用。
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                支持哪些支付方式？
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                支持支付宝、微信支付、银行卡等多种支付方式，企业用户还支持对公转账和发票开具。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 