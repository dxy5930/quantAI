-- 修复节点配置相关表的注释乱码问题
-- 使用ALTER TABLE语句修改表和字段注释，使用中文注释

-- 强制设置字符集
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;
SET character_set_client=utf8mb4;
SET character_set_results=utf8mb4;

-- 修复node_types表的注释
ALTER TABLE node_types COMMENT = '节点类型表-定义AI工作流中各种节点的类型信息';

-- 修复node_types表字段注释
ALTER TABLE node_types MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT '主键ID';
ALTER TABLE node_types MODIFY COLUMN type VARCHAR(50) NOT NULL UNIQUE COMMENT '节点类型标识符，唯一值，如data_source、filter、analysis等';
ALTER TABLE node_types MODIFY COLUMN name VARCHAR(100) NOT NULL COMMENT '节点类型显示名称';
ALTER TABLE node_types MODIFY COLUMN description TEXT COMMENT '节点类型描述信息';
ALTER TABLE node_types MODIFY COLUMN icon VARCHAR(50) COMMENT '节点图标标识符';
ALTER TABLE node_types MODIFY COLUMN color VARCHAR(50) COMMENT '节点颜色标识符';
ALTER TABLE node_types MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE node_types MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 修复node_config_fields表的注释
ALTER TABLE node_config_fields COMMENT = '节点配置字段表-定义各节点类型的配置字段信息';

-- 修复node_config_fields表字段注释
ALTER TABLE node_config_fields MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT '主键ID';
ALTER TABLE node_config_fields MODIFY COLUMN node_type VARCHAR(50) NOT NULL COMMENT '关联的节点类型标识符';
ALTER TABLE node_config_fields MODIFY COLUMN field_key VARCHAR(100) NOT NULL COMMENT '字段键名，用于表单提交和数据存储';
ALTER TABLE node_config_fields MODIFY COLUMN field_name VARCHAR(100) NOT NULL COMMENT '字段显示名称';
ALTER TABLE node_config_fields MODIFY COLUMN field_type ENUM('text', 'number', 'select', 'multiselect', 'boolean', 'range') NOT NULL COMMENT '字段类型：text-文本框，number-数字输入，select-单选下拉，multiselect-多选下拉，boolean-布尔开关，range-范围选择';
ALTER TABLE node_config_fields MODIFY COLUMN is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填字段';
ALTER TABLE node_config_fields MODIFY COLUMN default_value TEXT COMMENT '默认值';
ALTER TABLE node_config_fields MODIFY COLUMN placeholder VARCHAR(200) COMMENT '输入框占位符文本';
ALTER TABLE node_config_fields MODIFY COLUMN description TEXT COMMENT '字段描述和帮助信息';
ALTER TABLE node_config_fields MODIFY COLUMN sort_order INT DEFAULT 0 COMMENT '排序顺序，数值越小越靠前';
ALTER TABLE node_config_fields MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE node_config_fields MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

-- 修复node_config_options表的注释
ALTER TABLE node_config_options COMMENT = '节点配置选项表-定义select和multiselect类型字段的可选项';

-- 修复node_config_options表字段注释
ALTER TABLE node_config_options MODIFY COLUMN id BIGINT AUTO_INCREMENT COMMENT '主键ID';
ALTER TABLE node_config_options MODIFY COLUMN config_field_id BIGINT NOT NULL COMMENT '关联的配置字段ID';
ALTER TABLE node_config_options MODIFY COLUMN option_value VARCHAR(100) NOT NULL COMMENT '选项值，用于表单提交和数据存储';
ALTER TABLE node_config_options MODIFY COLUMN option_label VARCHAR(100) NOT NULL COMMENT '选项显示标签';
ALTER TABLE node_config_options MODIFY COLUMN option_description TEXT COMMENT '选项描述信息';
ALTER TABLE node_config_options MODIFY COLUMN sort_order INT DEFAULT 0 COMMENT '排序顺序，数值越小越靠前';
ALTER TABLE node_config_options MODIFY COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用此选项';
ALTER TABLE node_config_options MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE node_config_options MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'; 