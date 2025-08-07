-- 工作流实例表
CREATE TABLE IF NOT EXISTS workflow_instances (
    id VARCHAR(36) PRIMARY KEY COMMENT '工作流实例唯一标识符',
    user_id VARCHAR(36) COMMENT '创建用户ID，关联users表',
    title VARCHAR(255) NOT NULL COMMENT '工作流标题',
    description TEXT COMMENT '工作流描述信息',
    status ENUM('running', 'completed', 'failed', 'paused') DEFAULT 'running' COMMENT '工作流状态：running-运行中，completed-已完成，failed-失败，paused-暂停',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '执行进度百分比（0.00-100.00）',
    current_step INT DEFAULT 0 COMMENT '当前执行步骤序号',
    total_steps INT DEFAULT 0 COMMENT '总步骤数量',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '工作流开始执行时间',
    end_time TIMESTAMP NULL COMMENT '工作流结束时间',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活动时间',
    context_data JSON COMMENT '工作流上下文数据，存储执行过程中的变量和状态',
    error_message TEXT COMMENT '错误信息，记录执行失败时的详细错误',
    is_deleted TINYINT DEFAULT 0 COMMENT '软删除标记：0=正常，1=已删除',
    deleted_at TIMESTAMP NULL COMMENT '删除时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
    INDEX idx_user_id (user_id) COMMENT '用户ID索引，用于查询用户的工作流',
    INDEX idx_status (status) COMMENT '状态索引，用于按状态筛选工作流',
    INDEX idx_last_activity (last_activity) COMMENT '最后活动时间索引，用于排序和清理'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流实例表：存储AI工作流的基本信息、执行状态和进度';

-- 工作流步骤表
CREATE TABLE IF NOT EXISTS workflow_steps (
    id VARCHAR(36) PRIMARY KEY COMMENT '步骤唯一标识符',
    workflow_id VARCHAR(36) NOT NULL COMMENT '所属工作流ID，关联workflow_instances表',
    step_number INT NOT NULL COMMENT '步骤序号，从1开始递增',
    step_id VARCHAR(255) NOT NULL COMMENT '步骤标识符，用于识别步骤类型',
    content TEXT NOT NULL COMMENT '步骤内容，包括指令、代码、查询等',
    category ENUM('analysis', 'strategy', 'general', 'result', 'error') DEFAULT 'general' COMMENT '步骤类别：analysis-分析，strategy-策略，general-通用，result-结果，error-错误',
    resource_type ENUM('browser', 'database', 'api', 'general') DEFAULT 'general' COMMENT '资源类型：browser-浏览器，database-数据库，api-接口，general-通用',
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending' COMMENT '步骤状态：pending-待执行，running-执行中，completed-已完成，failed-失败',
    start_time TIMESTAMP NULL COMMENT '步骤开始执行时间',
    end_time TIMESTAMP NULL COMMENT '步骤结束时间',
    execution_details JSON COMMENT '执行详情，存储步骤执行的具体参数和配置',
    results JSON COMMENT '执行结果，存储步骤输出的数据和结果',
    urls JSON COMMENT '相关URL列表，存储步骤中访问的网址',
    files JSON COMMENT '相关文件列表，存储步骤中生成或使用的文件',
    error_message TEXT COMMENT '错误信息，记录步骤执行失败的详细原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '步骤创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '步骤最后更新时间',
    INDEX idx_workflow_id (workflow_id) COMMENT '工作流ID索引，用于查询工作流的所有步骤',
    INDEX idx_step_number (step_number) COMMENT '步骤序号索引，用于按顺序排列步骤',
    INDEX idx_status (status) COMMENT '状态索引，用于查询特定状态的步骤',
    UNIQUE KEY unique_workflow_step (workflow_id, step_number) COMMENT '确保同一工作流中步骤序号的唯一性'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流步骤表：存储工作流中每个执行步骤的详细信息和状态';

-- 工作流资源表
CREATE TABLE IF NOT EXISTS workflow_resources (
    id VARCHAR(36) PRIMARY KEY COMMENT '资源唯一标识符',
    workflow_id VARCHAR(36) NOT NULL COMMENT '所属工作流ID，关联workflow_instances表',
    step_id VARCHAR(36) COMMENT '产生该资源的步骤ID，关联workflow_steps表',
    resource_type ENUM('web', 'database', 'api', 'file', 'chart', 'general') NOT NULL COMMENT '资源类型：web-网页资源，database-数据库查询，api-接口调用，file-文件，chart-图表，general-通用',
    title VARCHAR(255) NOT NULL COMMENT '资源标题或名称',
    description TEXT COMMENT '资源描述信息',
    data JSON NOT NULL COMMENT '资源数据内容，存储具体的资源信息',
    category VARCHAR(100) COMMENT '资源分类标签',
    source_step_id VARCHAR(255) COMMENT '资源来源步骤的标识符',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '资源创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '资源最后更新时间',
    INDEX idx_workflow_id (workflow_id) COMMENT '工作流ID索引，用于查询工作流的所有资源',
    INDEX idx_resource_type (resource_type) COMMENT '资源类型索引，用于按类型筛选资源',
    INDEX idx_step_id (step_id) COMMENT '步骤ID索引，用于查询步骤产生的资源'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流资源表：存储工作流执行过程中产生的各种资源和数据';

-- 工作流消息记录表
CREATE TABLE IF NOT EXISTS workflow_messages (
    id VARCHAR(36) PRIMARY KEY COMMENT '消息唯一标识符',
    workflow_id VARCHAR(36) NOT NULL COMMENT '所属工作流ID，关联workflow_instances表',
    message_id VARCHAR(255) NOT NULL COMMENT '消息标识符，用于消息去重和追踪',
    message_type ENUM('user', 'system', 'task', 'result', 'assistant') NOT NULL COMMENT '消息类型：user-用户消息，system-系统消息，task-任务消息，result-结果消息，assistant-助手消息',
    content TEXT NOT NULL COMMENT '消息内容',
    status VARCHAR(50) COMMENT '消息状态，如已读、未读等',
    data JSON COMMENT '消息附加数据，存储扩展信息',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '消息时间戳',
    INDEX idx_workflow_id (workflow_id) COMMENT '工作流ID索引，用于查询工作流的消息记录',
    INDEX idx_message_type (message_type) COMMENT '消息类型索引，用于按类型筛选消息',
    INDEX idx_timestamp (timestamp) COMMENT '时间戳索引，用于按时间排序消息'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流消息记录表：存储工作流执行过程中的所有消息和通信记录';

-- 工作流用户收藏表
CREATE TABLE IF NOT EXISTS workflow_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏记录唯一标识符',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID，关联users表',
    workflow_id VARCHAR(36) NOT NULL COMMENT '工作流ID，关联workflow_instances表',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    INDEX idx_user_id (user_id) COMMENT '用户ID索引，用于查询用户的收藏列表',
    INDEX idx_workflow_id (workflow_id) COMMENT '工作流ID索引，用于查询工作流的收藏情况',
    UNIQUE KEY unique_user_workflow (user_id, workflow_id) COMMENT '确保同一用户不能重复收藏同一工作流'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流用户收藏表：存储用户对工作流的收藏关系'; 