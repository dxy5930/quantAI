import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCharsetWithTypescript1703000000000 implements MigrationInterface {
    name = 'FixCharsetWithTypescript1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 先设置连接字符集
        await queryRunner.query(`SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci`);
        
        // 删除已存在的表（按外键依赖关系倒序删除）
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_config_options`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_config_fields`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_types`);
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);

        // 重新创建node_types表
        await queryRunner.query(`
            CREATE TABLE node_types (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE COMMENT '节点类型',
                name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '节点类型显示名称',
                description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '节点类型描述',
                icon VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '图标名称',
                color VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '颜色主题',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点类型配置表'
        `);

        // 重新创建node_config_fields表
        await queryRunner.query(`
            CREATE TABLE node_config_fields (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                node_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '节点类型',
                field_key VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置项键名',
                field_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置项显示名称',
                field_type ENUM('text', 'number', 'select', 'multiselect', 'boolean', 'range') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置项类型',
                is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
                default_value TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '默认值',
                placeholder VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '占位符文本',
                description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '配置项描述',
                sort_order INT DEFAULT 0 COMMENT '排序序号',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (node_type) REFERENCES node_types(type) ON DELETE CASCADE,
                UNIQUE KEY unique_node_field (node_type, field_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点配置项表'
        `);

        // 重新创建node_config_options表
        await queryRunner.query(`
            CREATE TABLE node_config_options (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                config_field_id BIGINT NOT NULL COMMENT '配置项ID',
                option_value VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项值',
                option_label VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项显示名称',
                option_description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '选项描述',
                sort_order INT DEFAULT 0 COMMENT '排序序号',
                is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (config_field_id) REFERENCES node_config_fields(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点配置选项表'
        `);

        // 插入基础数据
        await queryRunner.query(`
            INSERT INTO node_types (type, name, description, icon, color) VALUES
            ('data', '数据收集', '收集股票数据、财务数据、新闻等', 'Database', 'blue'),
            ('analysis', '分析处理', '进行技术分析和基本面分析', 'BarChart3', 'green'),
            ('strategy', '策略生成', '基于分析结果生成投资策略', 'Target', 'purple'),
            ('risk', '风险评估', '评估策略风险和回测表现', 'Shield', 'orange'),
            ('output', '结果输出', '生成最终投资建议和报告', 'Zap', 'red'),
            ('custom', '自定义', '用户自定义的处理节点', 'Bot', 'gray')
        `);

        // 插入配置字段数据
        await queryRunner.query(`
            INSERT INTO node_config_fields (node_type, field_key, field_name, field_type, is_required, default_value, placeholder, description, sort_order) VALUES
            ('data', 'dataSources', '数据源', 'multiselect', true, '["stock_price"]', '选择数据源', '选择要收集的数据类型', 1),
            ('data', 'timeRange', '时间范围', 'select', true, '1y', '选择时间范围', '数据收集的时间范围', 2),
            ('data', 'symbols', '股票代码', 'text', false, '', '输入股票代码，多个用逗号分隔', '指定要分析的股票代码', 3)
        `);

        // 插入配置选项数据
        await queryRunner.query(`
            INSERT INTO node_config_options (config_field_id, option_value, option_label, option_description, sort_order) VALUES
            ((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'stock_price', '股价数据', '包含开盘价、收盘价、最高价、最低价等', 1),
            ((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'dataSources'), 'financial_data', '财务数据', '包含财务报表、财务指标等', 2),
            ((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1w', '1周', '最近1周的数据', 1),
            ((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1m', '1个月', '最近1个月的数据', 2),
            ((SELECT id FROM node_config_fields WHERE node_type = 'data' AND field_key = 'timeRange'), '1y', '1年', '最近1年的数据', 3)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除表
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_config_options`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_config_fields`);
        await queryRunner.query(`DROP TABLE IF EXISTS node_types`);
        await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
    }
} 