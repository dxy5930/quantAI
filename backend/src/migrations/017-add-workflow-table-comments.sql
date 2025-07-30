-- AI工作流表注释迁移脚本
-- 执行时间：2024-01-01
-- 描述：为AI工作流相关表添加详细的中文注释，提高代码可读性和维护性

-- =====================================================
-- 1. 工作流定义表注释更新
-- =====================================================

-- 更新工作流定义表注释
ALTER TABLE workflow_definitions COMMENT = 'AI工作流定义表 - 存储用户创建的工作流模板、配置信息和版本管理数据';

-- 更新工作流定义表字段注释
ALTER TABLE workflow_definitions 
MODIFY COLUMN id varchar(36) NOT NULL COMMENT '工作流定义唯一标识符，使用UUID格式，作为主键',
MODIFY COLUMN name varchar(255) NOT NULL COMMENT '工作流名称，用户自定义的工作流标题，最大255字符',
MODIFY COLUMN description text COMMENT '工作流描述，详细说明工作流的用途、功能和使用场景',
MODIFY COLUMN userId varchar(36) COMMENT '创建者用户ID，关联users表的主键，支持匿名用户（null值）',
MODIFY COLUMN status varchar(50) DEFAULT 'draft' COMMENT '工作流状态：draft-草稿状态，active-已激活可运行，archived-已归档，deleted-已删除',
MODIFY COLUMN category varchar(100) COMMENT '工作流分类标签：如技术分析、基本面分析、风险管理、策略生成、数据处理等',
MODIFY COLUMN nodes json NOT NULL COMMENT '工作流节点配置，JSON格式存储所有节点的详细信息：类型、参数、位置等',
MODIFY COLUMN connections json NOT NULL COMMENT '节点连接关系，JSON格式定义节点间的数据流向和执行顺序',
MODIFY COLUMN config json COMMENT '工作流全局配置参数，JSON格式存储执行超时、并发数、错误处理策略等',
MODIFY COLUMN metadata json COMMENT '工作流元数据，JSON格式包括标签、作者信息、使用说明、更新日志等',
MODIFY COLUMN isTemplate tinyint(1) DEFAULT 0 COMMENT '是否为模板：0-普通工作流（用户自用），1-可复用模板（供他人使用）',
MODIFY COLUMN isPublic tinyint(1) DEFAULT 0 COMMENT '是否公开：0-私有（仅创建者可见），1-公开（所有用户可见和使用）',
MODIFY COLUMN version int DEFAULT 0 COMMENT '版本号，用于工作流版本控制，每次修改后递增',
MODIFY COLUMN parentId varchar(36) COMMENT '父工作流ID，用于版本继承关系，指向原始版本的工作流ID',
MODIFY COLUMN tags text COMMENT '标签列表，逗号分隔的关键词，用于搜索和分类，如"股票,技术分析,MACD"',
MODIFY COLUMN createdAt timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间，记录工作流首次创建的时间戳',
MODIFY COLUMN updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间，记录工作流最后一次修改的时间戳';

-- =====================================================
-- 2. 工作流执行表注释更新
-- =====================================================

-- 更新工作流执行表注释
ALTER TABLE workflow_executions COMMENT = 'AI工作流执行记录表 - 存储工作流的执行历史、状态跟踪和结果数据';

-- 更新工作流执行表字段注释
ALTER TABLE workflow_executions 
MODIFY COLUMN id varchar(36) NOT NULL COMMENT '执行记录唯一标识符，使用UUID格式，作为主键',
MODIFY COLUMN executionId varchar(255) NOT NULL COMMENT '执行ID，用于前端和Python服务识别的执行标识，支持自定义格式',
MODIFY COLUMN workflowDefinitionId varchar(36) NOT NULL COMMENT '关联的工作流定义ID，外键关联workflow_definitions表的id字段',
MODIFY COLUMN userId varchar(36) COMMENT '执行用户ID，关联users表的主键，支持匿名执行（null值）',
MODIFY COLUMN status varchar(50) DEFAULT 'running' COMMENT '执行状态：running-运行中，completed-已完成，error-执行失败，stopped-用户主动停止',
MODIFY COLUMN progress int DEFAULT 0 COMMENT '执行进度百分比，范围0-100，用于前端显示进度条',
MODIFY COLUMN currentNodeId varchar(255) COMMENT '当前正在执行的节点ID，对应workflow_definitions.nodes中的节点标识',
MODIFY COLUMN nodeStatuses json COMMENT '所有节点的执行状态详情，JSON格式记录每个节点的运行状态和时间信息',
MODIFY COLUMN nodeResults json COMMENT '各节点的执行结果数据，JSON格式存储每个节点处理后的输出数据',
MODIFY COLUMN finalResults json COMMENT '工作流最终执行结果，JSON格式包含整个工作流的输出结果和汇总信息',
MODIFY COLUMN executionContext json COMMENT '执行上下文信息，JSON格式包括用户偏好、环境参数、输入数据等',
MODIFY COLUMN errorMessage text COMMENT '错误信息，当执行失败时记录详细的错误描述和堆栈信息',
MODIFY COLUMN executionLogs json COMMENT '执行日志，JSON数组格式记录详细的执行过程和调试信息',
MODIFY COLUMN startTime timestamp COMMENT '执行开始时间，记录工作流开始执行的精确时间戳',
MODIFY COLUMN endTime timestamp COMMENT '执行结束时间，记录工作流完成或失败的精确时间戳',
MODIFY COLUMN durationMs int COMMENT '执行持续时间，单位毫秒，用于性能分析和监控',
MODIFY COLUMN createdAt timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间，执行记录首次创建的时间戳',
MODIFY COLUMN updatedAt timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间，执行状态最后一次更新的时间戳';

-- =====================================================
-- 3. 创建索引注释（如果支持）
-- =====================================================

-- 为已存在的索引添加注释（MySQL 8.0+支持）
-- ALTER TABLE workflow_definitions ADD INDEX idx_userId_createdAt (userId, createdAt) COMMENT '用户ID和创建时间复合索引，用于快速查询用户的工作流列表';
-- ALTER TABLE workflow_definitions ADD INDEX idx_status (status) COMMENT '状态索引，用于按状态筛选工作流';
-- ALTER TABLE workflow_executions ADD INDEX idx_userId_createdAt (userId, createdAt) COMMENT '用户ID和创建时间复合索引，用于查询用户的执行历史';
-- ALTER TABLE workflow_executions ADD INDEX idx_workflowDefinitionId (workflowDefinitionId) COMMENT '工作流定义ID索引，用于查询特定工作流的执行记录';
-- ALTER TABLE workflow_executions ADD INDEX idx_status (status) COMMENT '执行状态索引，用于按状态筛选执行记录';

-- =====================================================
-- 4. 验证注释是否添加成功
-- =====================================================

-- 查看工作流定义表结构和注释
SHOW FULL COLUMNS FROM workflow_definitions;

-- 查看工作流执行表结构和注释
SHOW FULL COLUMNS FROM workflow_executions;

-- 查看表注释
SELECT 
    TABLE_NAME,
    TABLE_COMMENT
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('workflow_definitions', 'workflow_executions');

-- 迁移完成提示
SELECT 'Workflow table comments migration completed successfully!' as message; 