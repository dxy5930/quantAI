import React from 'react';
import { Target, Users, Award, TrendingUp, Shield, Zap } from 'lucide-react';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-400" />,
      title: '专业策略',
      description: '汇聚业内顶尖量化策略，经过严格回测验证'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-400" />,
      title: '安全可靠',
      description: '银行级安全保障，多重风险控制机制'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-400" />,
      title: '高效执行',
      description: '毫秒级交易执行，把握每一个投资机会'
    },
    {
      icon: <Users className="h-8 w-8 text-purple-400" />,
      title: '社区驱动',
      description: '活跃的量化交易社区，分享经验与策略'
    }
  ];

  const teamMembers = [
    {
      name: '张博士',
      role: '首席技术官',
      description: '清华大学金融工程博士，10年量化交易经验',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
    },
    {
      name: '李总',
      role: '产品总监',
      description: '前华尔街量化分析师，专注于策略优化',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
    },
    {
      name: '王工',
      role: '架构师',
      description: '资深系统架构师，负责平台技术架构设计',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
    },
    {
      name: '刘博士',
      role: '首席风控官',
      description: '金融风险管理专家，15年风控经验',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu'
    }
  ];

  const achievements = [
    { number: '10万+', label: '注册用户' },
    { number: '500+', label: '策略数量' },
    { number: '99.9%', label: '系统稳定性' },
    { number: '24/7', label: '技术支持' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* 头部介绍 */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">关于我们</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          我们致力于为投资者提供专业、安全、高效的量化交易解决方案，
          让每个人都能享受到量化投资带来的收益。
        </p>
      </div>

      {/* 使命愿景 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-8 w-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">我们的使命</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            通过先进的量化技术和数据分析，为投资者提供科学、理性的投资决策支持，
            让量化投资变得简单易用，人人都能参与其中。
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="h-8 w-8 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">我们的愿景</h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            成为全球领先的量化交易平台，构建一个开放、透明、高效的量化投资生态系统，
            推动金融科技创新发展。
          </p>
        </div>
      </div>

      {/* 核心特色 */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">核心特色</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 数据统计 */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-white text-center mb-8">平台数据</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{achievement.number}</div>
              <div className="text-gray-400">{achievement.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 团队介绍 */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">核心团队</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-gray-600"
              />
              <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
              <div className="text-blue-400 text-sm mb-3">{member.role}</div>
              <p className="text-gray-400 text-sm">{member.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 发展历程 */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-white text-center mb-8">发展历程</h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">2020</div>
            <div>
              <h3 className="text-lg font-semibold text-white">公司成立</h3>
              <p className="text-gray-400 text-sm">团队组建，开始量化交易平台的研发工作</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">2021</div>
            <div>
              <h3 className="text-lg font-semibold text-white">平台上线</h3>
              <p className="text-gray-400 text-sm">正式发布量化交易平台，获得首批用户</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">2022</div>
            <div>
              <h3 className="text-lg font-semibold text-white">快速发展</h3>
              <p className="text-gray-400 text-sm">用户数量突破5万，策略库不断丰富</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">2023</div>
            <div>
              <h3 className="text-lg font-semibold text-white">技术升级</h3>
              <p className="text-gray-400 text-sm">系统架构全面升级，性能和稳定性大幅提升</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">2024</div>
            <div>
              <h3 className="text-lg font-semibold text-white">持续创新</h3>
              <p className="text-gray-400 text-sm">用户突破10万，持续推出新功能和优化体验</p>
            </div>
          </div>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">联系我们</h2>
        <p className="text-gray-300 mb-6">
          如果您对我们的产品或服务有任何疑问，欢迎随时与我们联系。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="text-gray-300">
            <span className="font-medium">邮箱：</span>
            <a href="mailto:info@quantrade.com" className="text-blue-400 hover:text-blue-300">
              info@quantrade.com
            </a>
          </div>
          <div className="text-gray-300">
            <span className="font-medium">电话：</span>
            <a href="tel:400-123-4567" className="text-blue-400 hover:text-blue-300">
              400-123-4567
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 