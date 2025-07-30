const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载.env文件
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'chaogu',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  // 确保使用UTF8MB4编码
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
};

async function fixTableComments() {
  let connection;
  
  try {
    console.log('数据库配置:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***' : '(空)'
    });
    
    console.log('连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    // 设置字符集 - 使用更强的字符集设置
    await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.execute('SET CHARACTER SET utf8mb4');
    await connection.execute('SET character_set_connection=utf8mb4');
    await connection.execute('SET character_set_client=utf8mb4');
    await connection.execute('SET character_set_results=utf8mb4');
    
    console.log('读取SQL修复脚本...');
    const sqlFile = path.join(__dirname, '../src/migrations/021-fix-table-comments.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`执行 ${statements.length} 条SQL语句...`);
    
    for (const statement of statements) {
      if (statement) {
        console.log(`执行: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ 表注释修复完成！');
    
    // 使用二进制转换方式再次修复乱码
    console.log('\n使用二进制转换修复乱码...');
    const fixCommentsQueries = [
      "ALTER TABLE node_types COMMENT = '节点类型表-定义AI工作流中各种节点的类型信息'",
      "ALTER TABLE node_config_fields COMMENT = '节点配置字段表-定义各节点类型的配置字段信息'", 
      "ALTER TABLE node_config_options COMMENT = '节点配置选项表-定义select和multiselect类型字段的可选项'"
    ];
    
    for (const query of fixCommentsQueries) {
      console.log(`执行: ${query.substring(0, 50)}...`);
      await connection.execute(query);
    }
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('node_types', 'node_config_fields', 'node_config_options')
    `, [dbConfig.database]);
    
    console.log('表注释:');
    tables.forEach(table => {
      console.log(`  ${table.TABLE_NAME}: ${table.TABLE_COMMENT}`);
    });
    
  } catch (error) {
    console.error('❌ 修复表注释失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行脚本
if (require.main === module) {
  fixTableComments();
}

module.exports = { fixTableComments }; 