import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MessageSquare, Send, Check, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../hooks/useStore';

const FeedbackPage: React.FC = observer(() => {
  const appStore = useAppStore();
  
  const [formData, setFormData] = useState({
    type: 'feature', // feature, bug, suggestion, other
    title: '',
    content: '',
    contact: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackTypes = [
    { value: 'feature', label: '功能建议', icon: '💡', description: '建议新的功能或改进' },
    { value: 'bug', label: '问题反馈', icon: '🐛', description: '报告发现的错误或问题' },
    { value: 'suggestion', label: '优化建议', icon: '✨', description: '改进现有功能的建议' },
    { value: 'other', label: '其他反馈', icon: '💬', description: '其他类型的反馈' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      appStore.showError('请填写标题和详细内容');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      appStore.showSuccess('感谢您的反馈！我们会认真考虑您的建议');
      
      // 重置表单
      setTimeout(() => {
        setFormData({
          type: 'feature',
          title: '',
          content: '',
          contact: ''
        });
        setSubmitted(false);
      }, 3000);
      
    } catch (error) {
      appStore.showError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              反馈提交成功！
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              感谢您的宝贵意见，我们会认真考虑并及时回复
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            意见反馈
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          您的反馈对我们非常重要，帮助我们不断改进产品。请详细描述您的建议或遇到的问题。
        </p>
      </div>

      {/* 反馈表单 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 反馈类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-4">
              反馈类型
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbackTypes.map((type) => (
                <div
                  key={type.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                    {formData.type === type.value && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="sr-only"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 标题输入 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="请简要描述您的反馈..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              required
            />
          </div>

          {/* 详细内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              详细内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              rows={6}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="请详细描述您的建议、遇到的问题或其他反馈..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
              required
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              联系方式 <span className="text-sm text-gray-500 dark:text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              placeholder="如需回复，请留下您的邮箱或微信..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>提交中...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>提交反馈</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 提示信息 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">反馈处理说明：</p>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300">
              <li>• 我们会在2个工作日内回复您的反馈</li>
              <li>• 对于重要问题，我们会优先处理</li>
              <li>• 如有紧急问题，请通过客服联系我们</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FeedbackPage; 