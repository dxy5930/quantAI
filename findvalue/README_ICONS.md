# FindValue 应用图标和开屏页面配置

## 概述

本项目已经配置了完整的应用图标系统和开屏页面，使用FindValue品牌logo作为应用的核心视觉元素。

## 🎨 应用图标

### Android图标
已生成以下密度的图标：
- **mdpi** (48x48) - 中等密度屏幕
- **hdpi** (72x72) - 高密度屏幕  
- **xhdpi** (96x96) - 超高密度屏幕
- **xxhdpi** (144x144) - 超超高密度屏幕
- **xxxhdpi** (192x192) - 超超超高密度屏幕

每个密度都包含：
- `ic_launcher.png` - 标准图标
- `ic_launcher_round.png` - 圆形图标

### iOS图标
已生成以下尺寸的图标：
- 20x20, 29x29, 40x40, 58x58, 60x60
- 76x76, 80x80, 87x87, 114x114, 120x120
- 152x152, 167x167, 180x180, 1024x1024

## 🚀 开屏页面

### 功能特性
- **智能启动**: 根据广告配置决定是否显示开屏页
- **广告展示**: 显示小狐仙广告图片（如果有配置）
- **动画效果**: 淡入动画和缩放效果
- **倒计时**: 可配置显示时长，默认3秒自动跳转
- **跳过按钮**: 可提前跳过广告
- **深色主题**: 使用深色背景突出内容
- **无广告时**: 直接跳转到主页面，无额外步骤

### 启动流程优化

**最终优化后的流程**:
1. 原生启动屏 (图片很大) → 直接进入主页面

**简化逻辑**:
- 移除了所有React Native启动屏
- 移除了广告功能
- 原生启动屏显示完成后直接进入应用主页面
- 提供最简洁的启动体验

**错误处理机制**:
- 启用快速启动模式 (`fastStart: true`)
- 跳过所有网络检测和初始化检查
- 即使出现任何错误也直接进入主页面
- 10秒超时保护，防止应用卡在启动屏
- 开发模式下显示错误信息，生产模式下静默处理

### 配置说明
开屏页面位于 `src/pages/Splash/index.tsx`，支持以下配置：

```typescript
interface SplashPageProps {
  navigation: any;
  adImageUrl?: string;        // 广告图片URL（可选）
  displayDuration?: number;   // 显示时长（默认3秒）
  showSkipButton?: boolean;   // 是否显示跳过按钮
  skipButtonDelay?: number;   // 跳过按钮延迟显示时间
}
```

## 📁 文件结构

```
findvalue/
├── assets/
│   ├── FindValue.png          # 原始logo文件
│   └── splash/                # 开屏页面图标
│       ├── splash-200x200.png
│       ├── splash-300x300.png
│       ├── splash-400x400.png
│       ├── splash-500x500.png
│       └── splash-600x600.png
├── android/app/src/main/res/
│   ├── mipmap-mdpi/
│   ├── mipmap-hdpi/
│   ├── mipmap-xhdpi/
│   ├── mipmap-xxhdpi/
│   └── mipmap-xxxhdpi/
├── ios/findvalue/Images.xcassets/
│   └── AppIcon.appiconset/
└── src/pages/Splash/
    └── index.tsx              # 开屏页面组件
```

## 🛠️ 生成工具

### 图标生成脚本
```bash
# 生成所有尺寸的图标
npm run generate:icons
```

脚本功能：
- 自动安装sharp图像处理库
- 生成Android和iOS所有尺寸图标
- 创建开屏页面图标
- 生成iOS Contents.json配置文件

### 证书生成脚本
```bash
# 生成Android正式证书
npm run generate:keystore
```

## 🎯 使用场景

### 1. 无广告模式
当没有广告图片URL时，显示FindValue logo开屏页面：
- 深色背景
- 居中显示logo
- 3秒倒计时
- 可跳过

### 2. 广告模式
当有广告图片URL时，显示全屏广告：
- 全屏广告图片
- 右上角倒计时
- 跳过按钮
- 左下角"广告"标识

## 🔧 自定义配置

### 修改开屏时长
```typescript
// 在路由配置中
<SplashPage 
  displayDuration={5}  // 改为5秒
  showSkipButton={true}
  skipButtonDelay={2}
/>
```

### 修改logo样式
```typescript
// 在Splash/index.tsx中修改样式
const styles = StyleSheet.create({
  logo: {
    width: SCREEN_WIDTH * 0.8,  // 调整宽度
    height: SCREEN_HEIGHT * 0.4, // 调整高度
  },
  container: {
    backgroundColor: '#000000',  // 修改背景色
  },
});
```

## 📱 平台适配

### Android
- 支持所有密度屏幕
- 自动适配不同设备
- 支持圆形和方形图标

### iOS
- 支持iPhone和iPad
- 自动适配不同分辨率
- 符合App Store要求

## 🚀 部署说明

1. **开发环境**: 图标和开屏页面已配置完成
2. **测试环境**: 使用相同的图标配置
3. **生产环境**: 使用正式证书签名

## 📋 检查清单

- [x] FindValue logo已复制到assets目录
- [x] Android所有密度图标已生成
- [x] iOS所有尺寸图标已生成
- [x] 开屏页面已配置
- [x] 图标生成脚本已创建
- [x] 证书生成脚本已创建
- [x] 文档已更新

## 🔄 更新流程

如需更新logo或图标：

1. 替换 `assets/FindValue.png` 文件
2. 运行 `npm run generate:icons`
3. 重新构建应用

## 📞 技术支持

如有问题，请检查：
1. sharp库是否正确安装
2. 图片文件是否存在
3. 文件权限是否正确
4. 构建环境是否配置正确
