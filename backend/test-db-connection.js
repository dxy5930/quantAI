const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

// 数据库配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3366,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'restosuite',
  database: process.env.DB_DATABASE || 'chaogu',
  entities: [path.join(__dirname, 'src/**/*.entity{.ts,.js}')],
  synchronize: true,
  logging: false,
});

async function testConnection() {
  try {
    console.log('正在连接数据库...');
    await dataSource.initialize();
    console.log('数据库连接成功！');

    // 检查工作流定义表是否存在
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      const tables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_name LIKE '%workflow%'
      `);
      
      console.log('工作流相关表:', tables);

      // 检查workflow_definitions表结构
      if (tables.some(t => t.table_name === 'workflow_definitions')) {
        const columns = await queryRunner.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'workflow_definitions'
          AND table_schema = DATABASE()
          ORDER BY ordinal_position
        `);
        
        console.log('workflow_definitions表结构:', columns);

        // 查询表中的数据
        const count = await queryRunner.query('SELECT COUNT(*) as count FROM workflow_definitions');
        console.log('workflow_definitions表记录数:', count[0].count);

        // 查询最近的几条记录
        const recent = await queryRunner.query(`
          SELECT id, name, userId, status, createdAt 
          FROM workflow_definitions 
          ORDER BY createdAt DESC 
          LIMIT 5
        `);
        console.log('最近的工作流记录:', recent);
      } else {
        console.log('workflow_definitions表不存在');
      }

    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

testConnection();