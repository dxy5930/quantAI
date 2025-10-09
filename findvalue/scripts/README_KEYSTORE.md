# Android证书生成说明

## 概述

本目录包含用于生成Android正式发布证书的脚本。正式证书用于对生产环境的APK进行签名，确保应用的安全性和完整性。

## 生成证书

### 方法1: 使用Node.js脚本 (推荐)

```bash
npm run generate:keystore
```

### 方法2: 使用批处理脚本 (Windows)

```bash
scripts\generate-keystore.bat
```

### 方法3: 直接运行脚本

```bash
# Node.js脚本
node scripts/generate-keystore.js

# Windows批处理
scripts\generate-keystore.bat
```

## 证书信息

生成证书时需要提供以下信息：

1. **证书密码** - 至少6位，用于保护证书文件
2. **密钥别名** - 密钥的标识符，默认为 `findvalue`
3. **密钥密码** - 密钥的密码，默认与证书密码相同
4. **有效期** - 证书有效期，默认为25年
5. **证书信息** - 包含组织信息的DN，默认为：
   ```
   CN=FindValue, OU=IT, O=FindValue, L=Beijing, ST=Beijing, C=CN
   ```

## 生成的文件

证书生成后会在 `android/app/` 目录下创建以下文件：

- `release.keystore` - 正式证书文件
- `keystore-info.json` - 证书信息文件（包含密码等敏感信息）

## 安全注意事项

⚠️ **重要安全提示**：

1. **妥善保管证书文件** - 证书文件丢失将无法更新已发布的应用
2. **不要提交到版本控制** - 证书文件和密码信息不应提交到Git仓库
3. **使用密码管理器** - 建议将证书密码存储在安全的密码管理器中
4. **定期备份** - 定期备份证书文件到安全的位置
5. **限制访问权限** - 只有授权人员才能访问证书文件

## 证书配置

证书生成后，Android构建配置会自动使用该证书：

```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: "password"
        keyAlias System.getenv("KEY_ALIAS") ?: "findvalue"
        keyPassword System.getenv("KEY_PASSWORD") ?: "password"
    }
}
```

## 环境变量配置

为了安全起见，建议通过环境变量设置证书密码：

```bash
# 设置环境变量
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_ALIAS="findvalue"
export KEY_PASSWORD="your_key_password"

# 或者创建 .env.prod 文件
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=findvalue
KEY_PASSWORD=your_key_password
```

## 验证证书

生成证书后，可以使用以下命令验证：

```bash
# 查看证书信息
keytool -list -v -keystore android/app/release.keystore

# 查看证书别名
keytool -list -keystore android/app/release.keystore
```

## 故障排除

### 常见问题

1. **keytool命令不可用**
   - 确保已安装Java JDK
   - 将JDK的bin目录添加到PATH环境变量

2. **证书生成失败**
   - 检查输入信息是否正确
   - 确保有足够的磁盘空间
   - 检查文件权限

3. **构建时找不到证书**
   - 确保证书文件在正确位置
   - 检查环境变量设置
   - 验证证书密码是否正确

## 更新证书

如果需要更新证书（不推荐，除非证书即将过期）：

1. 备份现有证书
2. 生成新证书
3. 更新构建配置
4. 重新发布应用

## 相关文件

- `scripts/generate-keystore.js` - Node.js证书生成脚本
- `scripts/generate-keystore.bat` - Windows批处理脚本
- `android/app/build.gradle` - Android构建配置
- `.gitignore` - 排除证书文件的配置
