#!/usr/bin/env node

/**
 * 构建所有环境的Node.js脚本
 * 使用方法: node scripts/build-all.js [android|ios|all]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// 执行命令
function execCommand(command, description) {
  try {
    log.info(description);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log.error(`${description} 失败: ${error.message}`);
    return false;
  }
}

// 构建Android
function buildAndroid() {
  log.info('构建 Android 应用...');
  
  const commands = [
    { cmd: 'npm run build:android:dev', desc: '构建开发环境' },
    { cmd: 'npm run build:android:test', desc: '构建测试环境' },
    { cmd: 'npm run build:android:staging', desc: '构建预发布环境' },
    { cmd: 'npm run build:android:prod', desc: '构建生产环境' }
  ];
  
  for (const { cmd, desc } of commands) {
    if (!execCommand(cmd, desc)) {
      return false;
    }
    log.success(`Android ${desc}完成`);
  }
  
  return true;
}

// 构建iOS
function buildIOS() {
  log.info('构建 iOS 应用...');
  
  const commands = [
    { cmd: 'npm run build:ios:dev', desc: '构建开发环境' },
    { cmd: 'npm run build:ios:test', desc: '构建测试环境' },
    { cmd: 'npm run build:ios:staging', desc: '构建预发布环境' },
    { cmd: 'npm run build:ios:prod', desc: '构建生产环境' }
  ];
  
  for (const { cmd, desc } of commands) {
    if (!execCommand(cmd, desc)) {
      return false;
    }
    log.success(`iOS ${desc}完成`);
  }
  
  return true;
}

// 显示构建结果
function showResults(platform) {
  log.info('构建结果:');
  
  if (platform === 'android' || platform === 'all') {
    log.info('Android APK 位置:');
    const apkDir = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk');
    if (fs.existsSync(apkDir)) {
      findFiles(apkDir, '.apk').forEach(file => {
        log.info(`  - ${file}`);
      });
    }
  }
  
  if (platform === 'ios' || platform === 'all') {
    log.info('iOS 构建位置:');
    const iosBuildDir = path.join(__dirname, '..', 'ios', 'build');
    if (fs.existsSync(iosBuildDir)) {
      findFiles(iosBuildDir, '.app').forEach(file => {
        log.info(`  - ${file}`);
      });
    }
  }
}

// 查找文件
function findFiles(dir, extension) {
  const files = [];
  
  function search(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        search(fullPath);
      } else if (item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  search(dir);
  return files;
}

// 主函数
function main() {
  const platform = process.argv[2] || 'all';
  
  if (!['android', 'ios', 'all'].includes(platform)) {
    log.error(`无效的平台参数: ${platform}`);
    log.info('使用方法: node scripts/build-all.js [android|ios|all]');
    process.exit(1);
  }
  
  log.info(`开始构建 ${platform} 平台的所有环境...`);
  
  // 清理之前的构建
  if (!execCommand('npm run clean', '清理之前的构建')) {
    log.warning('清理失败，继续构建...');
  }
  
  let success = true;
  
  // 执行构建
  switch (platform) {
    case 'android':
      success = buildAndroid();
      break;
    case 'ios':
      success = buildIOS();
      break;
    case 'all':
      success = buildAndroid() && buildIOS();
      break;
  }
  
  if (success) {
    log.success('所有构建完成！');
    showResults(platform);
  } else {
    log.error('构建过程中出现错误');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { buildAndroid, buildIOS, showResults };
