#!/usr/bin/env node

/**
 * 使用环境变量启动Metro的脚本
 * 使用方法: node scripts/start-with-env.js <environment>
 */

const { execSync } = require('child_process');
const { getEnvConfig } = require('./env-loader');

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'prod';
  
  try {
    // 获取环境配置
    const env = getEnvConfig(environment);
    
    console.log(`[INFO] 启动Metro服务器 - 环境: ${environment}`);
    console.log(`[INFO] API地址: ${env.API_BASE_URL}`);
    console.log(`[INFO] 调试模式: ${env.DEBUG_MODE}`);
    
    // 设置环境变量并启动Metro
    if (process.platform === 'win32') {
      // Windows使用set命令设置环境变量
      const setCommands = Object.entries(env)
        .map(([key, value]) => `set ${key}=${value}`)
        .join(' && ');
      const fullCommand = `${setCommands} && react-native start --reset-cache`;
      
      console.log(`[INFO] 执行命令: ${fullCommand}`);
      execSync(fullCommand, { stdio: 'inherit' });
    } else {
      // Unix/Linux/Mac使用标准语法
      const envVars = Object.entries(env)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      const fullCommand = `${envVars} react-native start --reset-cache`;
      
      console.log(`[INFO] 执行命令: ${fullCommand}`);
      execSync(fullCommand, { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error(`[ERROR] 启动失败: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
