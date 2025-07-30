import React, { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronRight, Book, Video, MessageCircle, Mail } from 'lucide-react';

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const faqData = [
    {
      category: '快速入门',
      questions: [
        {
          question: '如何开始使用量化交易系统？',
          answer: '首先注册账户，然后浏览策略库选择适合的策略，配置参数后进行回测验证。'
        },
        {
          question: '什么是策略回测？',
          answer: '策略回测是使用历史数据来测试交易策略的过程，帮助您评估策略的盈利能力和风险。'
        },
        {
          question: '如何选择合适的策略？',
          answer: '根据您的风险承受能力、投资目标和市场偏好来选择策略。建议先从简单的策略开始。'
        }
      ]
    },
    {
      category: '策略管理',
      questions: [
        {
          question: '如何创建自定义策略？',
          answer: '在策略编辑器中编写策略代码，定义买卖信号和风险管理规则，然后进行回测验证。'
        },
        {
          question: '策略参数如何优化？',
          answer: '使用参数优化功能，系统会自动测试不同参数组合，找到最优参数配置。'
        },
        {
          question: '如何分享我的策略？',
          answer: '在策略详情页面点击"分享"按钮，设置分享权限后即可与其他用户分享。'
        }
      ]
    },
    {
      category: '风险管理',
      questions: [
        {
          question: '如何设置止损止盈？',
          answer: '在策略配置中设置止损比例和止盈目标，系统会自动执行风险控制。'
        },
        {
          question: '什么是最大回撤？',
          answer: '最大回撤是投资组合从峰值到谷底的最大跌幅，用于衡量策略的风险水平。'
        },
        {
          question: '如何控制仓位大小？',
          answer: '通过仓位管理设置，可以控制每次交易的资金比例，降低单笔交易风险。'
        }
      ]
    },
    {
      category: '技术支持',
      questions: [
        {
          question: '遇到技术问题如何解决？',
          answer: '可以查看帮助文档、观看视频教程，或联系客服获取技术支持。'
        },
        {
          question: '如何获取API接口？',
          answer: '在个人设置中申请API密钥，查看API文档了解接口使用方法。'
        },
        {
          question: '数据更新频率如何？',
          answer: '市场数据实时更新，历史数据每日更新，确保策略测试的准确性。'
        }
      ]
    }
  ];

  const toggleSection = (category: string) => {
    setExpandedSection(expandedSection === category ? null : category);
  };

  const filteredFaq = faqData.map(section => ({
    ...section,
    questions: section.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <HelpCircle className="h-8 w-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">帮助中心</h1>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索帮助内容..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onCompositionStart={() => {}}
          onCompositionEnd={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          onBlur={() => setSearchTerm('')}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 快速链接 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Book className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">用户手册</h3>
          </div>
          <p className="text-gray-400 text-sm">详细的使用指南和功能说明</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <Video className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">视频教程</h3>
          </div>
          <p className="text-gray-400 text-sm">观看视频快速掌握使用技巧</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3 mb-3">
            <MessageCircle className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">社区论坛</h3>
          </div>
          <p className="text-gray-400 text-sm">与其他用户交流经验和技巧</p>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">常见问题</h2>
        </div>

        <div className="divide-y divide-gray-700">
          {filteredFaq.map((section) => (
            <div key={section.category}>
              <button
                onClick={() => toggleSection(section.category)}
                className="w-full px-6 py-4 text-left hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{section.category}</h3>
                  {expandedSection === section.category ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedSection === section.category && (
                <div className="px-6 pb-4 space-y-4">
                  {section.questions.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-white mb-2">{item.question}</h4>
                      <p className="text-gray-400 text-sm">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 联系我们 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">联系我们</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-400" />
            <div>
              <div className="text-white font-medium">邮箱支持</div>
              <div className="text-gray-400 text-sm">support@quantrade.com</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-green-400" />
            <div>
              <div className="text-white font-medium">在线客服</div>
              <div className="text-gray-400 text-sm">工作日 9:00-18:00</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">
            如果您没有找到想要的答案，请随时联系我们的客服团队。我们会尽快为您解答。
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage; 