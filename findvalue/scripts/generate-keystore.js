#!/usr/bin/env node

/**
 * 生成Android正式证书的脚本
 * 使用方法: node scripts/generate-keystore.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 生成证书
async function generateKeystore() {
  try {
    log.info('开始生成Android正式证书...\n');
    
    // 检查keytool是否可用
    try {
      execSync('keytool -help', { stdio: 'ignore' });
    } catch (error) {
      log.error('keytool命令不可用，请确保已安装Java JDK');
      process.exit(1);
    }
    
    const androidDir = path.join(__dirname, '..', 'android', 'app');
    const keystorePath = path.join(androidDir, 'release.keystore');
    
    // 检查证书是否已存在
    if (fs.existsSync(keystorePath)) {
      const overwrite = await askQuestion('证书文件已存在，是否覆盖？(y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        log.info('取消生成证书');
        rl.close();
        return;
      }
    }
    
    // 获取用户输入
    log.info('请输入证书信息:');
    const keystorePassword = await askQuestion('证书密码 (至少6位): ');
    const keyAlias = await askQuestion('密钥别名 (默认: findvalue): ') || 'findvalue';
    const keyPassword = await askQuestion('密钥密码 (默认与证书密码相同): ') || keystorePassword;
    const validity = await askQuestion('证书有效期(年) (默认: 25): ') || '25';
    const dname = await askQuestion('证书信息 (默认: CN=FindValue, OU=IT, O=FindValue, L=Beijing, ST=Beijing, C=CN): ') || 
                  'CN=FindValue, OU=IT, O=FindValue, L=Beijing, ST=Beijing, C=CN';
    
    // 验证输入
    if (keystorePassword.length < 6) {
      log.error('证书密码至少需要6位');
      rl.close();
      return;
    }
    
    // 生成证书命令
    const keytoolCmd = [
      'keytool',
      '-genkeypair',
      '-v',
      '-keystore', keystorePath,
      '-alias', keyAlias,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', (parseInt(validity) * 365).toString(),
      '-dname', `"${dname}"`,
      '-storepass', keystorePassword,
      '-keypass', keyPassword
    ].join(' ');
    
    log.info('正在生成证书...');
    execSync(keytoolCmd, { stdio: 'inherit' });
    
    // 创建证书信息文件
    const keystoreInfo = {
      keystorePath: 'android/app/release.keystore',
      keyAlias: keyAlias,
      storePassword: keystorePassword,
      keyPassword: keyPassword,
      generatedAt: new Date().toISOString(),
      validity: `${validity}年`
    };
    
    const infoPath = path.join(androidDir, 'keystore-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(keystoreInfo, null, 2));
    
    log.success('证书生成成功！');
    log.info(`证书位置: ${keystorePath}`);
    log.info(`证书信息: ${infoPath}`);
    
    // 显示证书信息
    log.info('\n证书信息:');
    console.log(`  别名: ${keyAlias}`);
    console.log(`  有效期: ${validity}年`);
    console.log(`  算法: RSA 2048位`);
    console.log(`  位置: android/app/release.keystore`);
    
    // 安全提示
    log.warning('\n⚠️  重要安全提示:');
    console.log('1. 请妥善保管证书文件和密码');
    console.log('2. 不要将证书文件提交到版本控制系统');
    console.log('3. 建议将证书信息存储在安全的密码管理器中');
    console.log('4. 证书丢失将无法更新已发布的应用');
    
    // 更新.gitignore
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    const keystoreIgnore = [
      '# Android keystore files',
      'android/app/*.keystore',
      'android/app/keystore-info.json',
      'android/app/release.keystore'
    ].join('\n');
    
    if (!gitignoreContent.includes('android/app/*.keystore')) {
      gitignoreContent += '\n' + keystoreIgnore + '\n';
      fs.writeFileSync(gitignorePath, gitignoreContent);
      log.info('已更新.gitignore文件，排除证书文件');
    }
    
  } catch (error) {
    log.error(`生成证书失败: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  generateKeystore();
}

module.exports = { generateKeystore };
