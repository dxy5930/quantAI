# 数据库字符集问题修复指南

## 问题描述
出现 `ERROR 1366 (HY000): Incorrect string value` 错误，通常是由于数据库或表的字符集不支持UTF-8中文字符导致的。

## 解决步骤

### 1. 检查数据库字符集
```sql
-- 查看数据库字符集
SHOW CREATE DATABASE your_database_name;

-- 查看所有数据库的字符集
SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA;
```

### 2. 修改数据库字符集（如果需要）
```sql
-- 修改数据库字符集为utf8mb4
ALTER DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 执行修复脚本
使用我们准备好的完整修复脚本：

```bash
# 方法1：使用MySQL命令行工具
mysql -u root -p your_database_name < src/migrations/019-check-and-fix-charset.sql

# 方法2：如果MySQL不在PATH中，使用完整路径
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p your_database_name < src/migrations/019-check-and-fix-charset.sql

# 方法3：使用MySQL Workbench
# 打开MySQL Workbench，连接到数据库，然后打开并执行 019-check-and-fix-charset.sql 文件
```

### 4. 连接字符集设置
确保你的数据库连接也使用正确的字符集：

#### 在MySQL连接URL中设置：
```
mysql://username:password@localhost:3306/database_name?charset=utf8mb4
```

#### 在连接时执行：
```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 验证修复结果
执行以下查询验证字符集设置：

```sql
-- 检查数据库字符集
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'your_database_name';

-- 检查表字符集
SELECT TABLE_NAME, TABLE_COLLATION 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'your_database_name' 
AND TABLE_NAME IN ('node_types', 'node_config_fields', 'node_config_options');

-- 检查列字符集
SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'your_database_name' 
AND TABLE_NAME IN ('node_types', 'node_config_fields', 'node_config_options')
AND CHARACTER_SET_NAME IS NOT NULL;
```

## 常见问题

### Q: 为什么使用 utf8mb4 而不是 utf8？
A: MySQL的 `utf8` 字符集实际上只支持最多3字节的UTF-8字符，不支持emoji和某些复杂中文字符。`utf8mb4` 支持完整的4字节UTF-8字符集。

### Q: 如果还是报错怎么办？
A: 
1. 检查MySQL服务器的默认字符集配置
2. 确保客户端连接使用了正确的字符集
3. 检查文件本身的编码是否为UTF-8

### Q: 如何设置MySQL服务器默认字符集？
A: 在 `my.cnf` 或 `my.ini` 文件中添加：
```ini
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

[mysql]
default-character-set=utf8mb4

[client]
default-character-set=utf8mb4
```

## 执行顺序
1. 首先修改数据库字符集
2. 然后执行 `019-check-and-fix-charset.sql` 脚本
3. 验证结果
4. 测试插入中文数据 