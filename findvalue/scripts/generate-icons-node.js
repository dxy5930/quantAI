#!/usr/bin/env node

/**
 * 使用Node.js生成不同尺寸应用图标的脚本
 * 不依赖ImageMagick，使用sharp库
 * 使用方法: node scripts/generate-icons-node.js
 */

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

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Android图标尺寸配置
const androidSizes = [
  { name: 'mipmap-mdpi', size: 48, density: 'mdpi' },
  { name: 'mipmap-hdpi', size: 72, density: 'hdpi' },
  { name: 'mipmap-xhdpi', size: 96, density: 'xhdpi' },
  { name: 'mipmap-xxhdpi', size: 144, density: 'xxhdpi' },
  { name: 'mipmap-xxxhdpi', size: 192, density: 'xxxhdpi' }
];

// iOS图标尺寸配置
const iosSizes = [
  { name: '20x20', size: 20 },
  { name: '29x29', size: 29 },
  { name: '40x40', size: 40 },
  { name: '58x58', size: 58 },
  { name: '60x60', size: 60 },
  { name: '76x76', size: 76 },
  { name: '80x80', size: 80 },
  { name: '87x87', size: 87 },
  { name: '114x114', size: 114 },
  { name: '120x120', size: 120 },
  { name: '152x152', size: 152 },
  { name: '167x167', size: 167 },
  { name: '180x180', size: 180 },
  { name: '1024x1024', size: 1024 }
];

// 检查sharp是否安装
function checkSharp() {
  try {
    require('sharp');
    return true;
  } catch (error) {
    return false;
  }
}

// 安装sharp
function installSharp() {
  log.info('正在安装sharp库...');
  try {
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    return true;
  } catch (error) {
    log.error('安装sharp失败，请手动运行: npm install sharp');
    return false;
  }
}

// 生成Android图标
async function generateAndroidIcons(sourceImage) {
  log.info('生成Android图标...');
  
  const sharp = require('sharp');
  const androidDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  
  for (const { name, size, density } of androidSizes) {
    const targetDir = path.join(androidDir, name);
    const targetFile = path.join(targetDir, 'ic_launcher.png');
    const targetFileRound = path.join(targetDir, 'ic_launcher_round.png');
    
    // 创建目录
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    try {
      // 生成普通图标
      await sharp(sourceImage)
        .resize(size, size)
        .png()
        .toFile(targetFile);
      
      // 生成圆形图标
      const roundedIcon = await sharp(sourceImage)
        .resize(size, size)
        .png()
        .toBuffer();
      
      // 创建圆形遮罩
      const mask = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: Buffer.from(`
            <svg width="${size}" height="${size}">
              <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
            </svg>
          `),
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();
      
      await sharp(roundedIcon)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toFile(targetFileRound);
      
      log.success(`生成 ${density} (${size}x${size}) 图标`);
    } catch (error) {
      log.error(`生成 ${density} 图标失败: ${error.message}`);
    }
  }
}

// 生成iOS图标
async function generateIOSIcons(sourceImage) {
  log.info('生成iOS图标...');
  
  const sharp = require('sharp');
  const iosDir = path.join(__dirname, '..', 'ios', 'findvalue', 'Images.xcassets', 'AppIcon.appiconset');
  
  // 创建目录
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }
  
  for (const { name, size } of iosSizes) {
    const targetFile = path.join(iosDir, `icon-${name}.png`);
    
    try {
      await sharp(sourceImage)
        .resize(size, size)
        .png()
        .toFile(targetFile);
      log.success(`生成 ${name} 图标`);
    } catch (error) {
      log.error(`生成 ${name} 图标失败: ${error.message}`);
    }
  }
  
  // 生成Contents.json文件
  generateIOSContentsJson(iosDir);
}

// 生成iOS Contents.json
function generateIOSContentsJson(iosDir) {
  const contents = {
    "images": [
      {
        "filename": "icon-20x20.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "20x20"
      },
      {
        "filename": "icon-20x20.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "20x20"
      },
      {
        "filename": "icon-29x29.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "29x29"
      },
      {
        "filename": "icon-29x29.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "29x29"
      },
      {
        "filename": "icon-40x40.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "40x40"
      },
      {
        "filename": "icon-40x40.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "40x40"
      },
      {
        "filename": "icon-60x60.png",
        "idiom": "iphone",
        "scale": "2x",
        "size": "60x60"
      },
      {
        "filename": "icon-60x60.png",
        "idiom": "iphone",
        "scale": "3x",
        "size": "60x60"
      },
      {
        "filename": "icon-76x76.png",
        "idiom": "ipad",
        "scale": "1x",
        "size": "76x76"
      },
      {
        "filename": "icon-76x76.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "76x76"
      },
      {
        "filename": "icon-83.5x83.5.png",
        "idiom": "ipad",
        "scale": "2x",
        "size": "83.5x83.5"
      },
      {
        "filename": "icon-1024x1024.png",
        "idiom": "ios-marketing",
        "scale": "1x",
        "size": "1024x1024"
      }
    ],
    "info": {
      "author": "xcode",
      "version": 1
    }
  };
  
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(contents, null, 2));
  log.success('生成iOS Contents.json文件');
}

// 生成开屏页面图标
async function generateSplashIcons(sourceImage) {
  log.info('生成开屏页面图标...');
  
  const sharp = require('sharp');
  const splashDir = path.join(__dirname, '..', 'assets', 'splash');
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }
  
  // 生成不同尺寸的开屏图标
  const splashSizes = [200, 300, 400, 500, 600];
  
  for (const size of splashSizes) {
    const targetFile = path.join(splashDir, `splash-${size}x${size}.png`);
    
    try {
      await sharp(sourceImage)
        .resize(size, size)
        .png()
        .toFile(targetFile);
      log.success(`生成开屏图标 ${size}x${size}`);
    } catch (error) {
      log.error(`生成开屏图标 ${size}x${size} 失败: ${error.message}`);
    }
  }
}

// 主函数
async function main() {
  const sourceImage = path.join(__dirname, '..', 'assets', 'FindValue.png');
  
  // 检查源文件是否存在
  if (!fs.existsSync(sourceImage)) {
    log.error(`源图片文件不存在: ${sourceImage}`);
    process.exit(1);
  }
  
  // 检查sharp是否安装
  if (!checkSharp()) {
    log.warning('sharp库未安装，正在安装...');
    if (!installSharp()) {
      process.exit(1);
    }
  }
  
  log.info('开始生成应用图标...');
  log.info(`源图片: ${sourceImage}`);
  
  try {
    // 生成Android图标
    await generateAndroidIcons(sourceImage);
    
    // 生成iOS图标
    await generateIOSIcons(sourceImage);
    
    // 生成开屏页面图标
    await generateSplashIcons(sourceImage);
    
    log.success('所有图标生成完成！');
    
    // 显示生成的文件
    log.info('\n生成的文件:');
    log.info('Android图标: android/app/src/main/res/mipmap-*/');
    log.info('iOS图标: ios/findvalue/Images.xcassets/AppIcon.appiconset/');
    log.info('开屏图标: assets/splash/');
    
  } catch (error) {
    log.error(`生成图标失败: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateAndroidIcons, generateIOSIcons, generateSplashIcons };
