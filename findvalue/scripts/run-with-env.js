#!/usr/bin/env node

/**
 * 使用环境变量运行命令的脚本
 * 使用方法: node scripts/run-with-env.js <environment> <platform> [action]
 */

const { execSync } = require('child_process');
const { getEnvConfig, generateBuildCommand } = require('./env-loader');

function main() {
  const args = process.argv.slice(2);
  const environment = args[0];
  const platform = args[1];
  const action = args[2] || 'run';
  
  if (!environment || !platform) {
    console.error('使用方法: node scripts/run-with-env.js <environment> <platform> [action]');
    console.error('环境: dev, test, staging, prod');
    console.error('平台: android, ios');
    console.error('操作: run, build (默认: run)');
    process.exit(1);
  }
  
  try {
    // 获取环境配置
    const env = getEnvConfig(environment);
    
    // 生成构建命令
    const command = generateBuildCommand(environment, platform, action);
    
    if (!command) {
      console.error(`不支持的平台: ${platform}`);
      process.exit(1);
    }
    
    // 设置环境变量
    const envVars = Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    
    // 执行命令 - Windows兼容性处理
    let fullCommand;
    if (process.platform === 'win32') {
      // Windows使用set命令设置环境变量
      const setCommands = Object.entries(env)
        .map(([key, value]) => `set ${key}=${value}`)
        .join(' && ');
      fullCommand = setCommands ? `${setCommands} && ${command.command}` : command.command;
    } else {
      // Unix/Linux/Mac使用标准语法
      fullCommand = envVars ? `${envVars} ${command.command}` : command.command;
    }
    
    console.log(`[INFO] 执行命令: ${fullCommand}`);
    console.log(`[INFO] 环境: ${environment}, 平台: ${platform}, 操作: ${action}`);
    
    execSync(fullCommand, { stdio: 'inherit' });
    
  } catch (error) {
    console.error(`[ERROR] 执行失败: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
