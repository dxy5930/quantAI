#!/usr/bin/env node

/**
 * 生产环境配置检查脚本
 * 确保生产环境配置正确，防止使用测试数据
 */

const { getEnvConfig } = require('./env-loader');

function checkProductionConfig() {
  console.log('🔍 检查生产环境配置...\n');
  
  const prodConfig = getEnvConfig('prod');
  
  // 检查关键配置
  const checks = [
    {
      name: 'API地址',
      value: prodConfig.API_BASE_URL,
      expected: 'https://api.findvalue.com',
      critical: true
    },
    {
      name: '调试模式',
      value: prodConfig.DEBUG_MODE,
      expected: 'false',
      critical: true
    },
    {
      name: '应用名称',
      value: prodConfig.APP_NAME,
      expected: 'FindValue',
      critical: false
    },
    {
      name: '包名后缀',
      value: prodConfig.APP_ID_SUFFIX,
      expected: '',
      critical: false
    }
  ];
  
  let hasErrors = false;
  
  checks.forEach(check => {
    const status = check.value === check.expected ? '✅' : '❌';
    const critical = check.critical ? ' [关键]' : '';
    
    console.log(`${status} ${check.name}: ${check.value}${critical}`);
    
    if (check.value !== check.expected) {
      if (check.critical) {
        hasErrors = true;
        console.log(`   ⚠️  期望值: ${check.expected}`);
      }
    }
  });
  
  // 检查是否包含测试相关配置
  const testKeywords = ['test', 'dev', 'localhost', 'debug'];
  const suspiciousConfigs = [];
  
  Object.entries(prodConfig).forEach(([key, value]) => {
    if (typeof value === 'string') {
      testKeywords.forEach(keyword => {
        if (value.toLowerCase().includes(keyword)) {
          suspiciousConfigs.push({ key, value, keyword });
        }
      });
    }
  });
  
  if (suspiciousConfigs.length > 0) {
    console.log('\n⚠️  发现可疑的测试配置:');
    suspiciousConfigs.forEach(config => {
      console.log(`   - ${config.key}: ${config.value} (包含 "${config.keyword}")`);
    });
    hasErrors = true;
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ 生产环境配置检查失败！');
    console.log('请检查 .env.prod 文件中的配置。');
    process.exit(1);
  } else {
    console.log('✅ 生产环境配置检查通过！');
  }
}

if (require.main === module) {
  checkProductionConfig();
}

module.exports = { checkProductionConfig };
