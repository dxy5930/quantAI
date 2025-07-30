const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

// 根据环境加载对应的.env文件
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'chaogu',
  entities: [
    'src/modules/stocks/entities/*.entity.ts',
    'src/modules/ai-workflow/entities/*.entity.ts',
    'src/shared/entities/*.entity.ts'
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: env === 'development',
  timezone: '+08:00',
  charset: 'utf8mb4',
});

module.exports = { AppDataSource };