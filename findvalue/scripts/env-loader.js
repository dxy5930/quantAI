#!/usr/bin/env node

/**
 * 环境变量加载器
 * 从.env文件读取配置并生成构建配置
 */

const fs = require('fs');
const path = require('path');

// 解析.env文件
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`环境文件不存在: ${filePath}`);
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

// 获取环境配置
function getEnvConfig(environment) {
  // 如果没有指定环境，默认使用生产环境
  if (!environment) {
    environment = 'prod';
  }
  
  const envFile = path.join(__dirname, '..', `.env.${environment}`);
  return parseEnvFile(envFile);
}

// 生成Android构建配置
function generateAndroidConfig(env) {
  const config = {
    applicationIdSuffix: env.APP_ID_SUFFIX || '',
    versionNameSuffix: env.VERSION_SUFFIX || '',
    appName: env.APP_NAME || 'FindValue',
    apiBaseUrl: env.API_BASE_URL || 'http://localhost:3000',
    debugMode: env.DEBUG_MODE === 'true',
    nodeEnv: env.NODE_ENV || 'development'
  };
  
  return config;
}

// 生成iOS构建配置
function generateIOSConfig(env) {
  const config = {
    displayName: env.APP_NAME || 'FindValue',
    apiBaseUrl: env.API_BASE_URL || 'http://localhost:3000',
    debugMode: env.DEBUG_MODE === 'true',
    nodeEnv: env.NODE_ENV || 'development'
  };
  
  return config;
}

// 生成构建脚本命令
function generateBuildCommand(environment, platform, action = 'run') {
  const env = getEnvConfig(environment);
  
  if (platform === 'android') {
    const variant = environment === 'test' ? 'qa' : environment;
    const buildType = env.DEBUG_MODE ? 'Debug' : 'Release';
    const fullVariant = `${variant}${buildType}`;
    
    if (action === 'build') {
      // 构建时传递Gradle属性
      const gradleProps = [
        `-PAPP_NAME="${env.APP_NAME}"`,
        `-PAPP_ID_SUFFIX="${env.APP_ID_SUFFIX}"`,
        `-PVERSION_SUFFIX="${env.VERSION_SUFFIX}"`
      ].join(' ');
      
      const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      return {
        command: `cd android && ${gradleCmd} assemble${fullVariant} ${gradleProps}`,
        env: env
      };
    } else {
      // 运行特定变体
      const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      return {
        command: `cd android && ${gradleCmd} install${fullVariant}`,
        env: env
      };
    }
  } else if (platform === 'ios') {
    const configuration = env.DEBUG_MODE ? 'Debug' : 'Release';
    
    return {
      command: action === 'build' ? 
        `react-native run-ios --configuration=${configuration}` :
        `react-native run-ios --configuration=${configuration}`,
      env: env
    };
  }
  
  return null;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const action = args[0]; // 'config', 'command', 'env'
  const environment = args[1];
  const platform = args[2];
  const buildAction = args[3]; // 'run' or 'build'
  
  switch (action) {
    case 'config':
      if (!environment) {
        console.error('请指定环境: node scripts/env-loader.js config <environment>');
        process.exit(1);
      }
      const config = getEnvConfig(environment);
      console.log(JSON.stringify(config, null, 2));
      break;
      
    case 'command':
      if (!environment || !platform) {
        console.error('请指定环境和平台: node scripts/env-loader.js command <environment> <platform> [build|run]');
        process.exit(1);
      }
      const command = generateBuildCommand(environment, platform, buildAction || 'run');
      if (command) {
        console.log(JSON.stringify(command, null, 2));
      }
      break;
      
    case 'env':
      if (!environment) {
        console.error('请指定环境: node scripts/env-loader.js env <environment>');
        process.exit(1);
      }
      const env = getEnvConfig(environment);
      // 输出为环境变量格式
      Object.entries(env).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
      });
      break;
      
    default:
      console.log('使用方法:');
      console.log('  node scripts/env-loader.js config <environment>     - 获取环境配置');
      console.log('  node scripts/env-loader.js command <env> <platform> [action] - 生成构建命令');
      console.log('  node scripts/env-loader.js env <environment>        - 输出环境变量');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getEnvConfig,
  generateAndroidConfig,
  generateIOSConfig,
  generateBuildCommand
};
