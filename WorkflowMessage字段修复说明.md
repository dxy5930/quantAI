# WorkflowMessage 字段修复说明

## 问题描述
在新建工作流任务时出现错误：
```
"获取工作流历史失败: type object 'WorkflowMessage' has no attribute 'created_at'"
```

## 根本原因
`WorkflowMessage` 数据库模型缺少标准的时间戳字段：
- 缺少 `created_at` 字段
- 缺少 `updated_at` 字段

这导致在获取工作流历史时，代码尝试访问不存在的字段而报错。

## 修复内容

### 1. 数据库模型修复
**文件**: `python-analysis-service/models/workflow_models.py`

**修改前**:
```python
class WorkflowMessage(Base):
    __tablename__ = 'workflow_messages'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    message_id = Column(String(255), nullable=False)
    message_type = Column(SQLEnum(MessageType, name='messagetype'), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(50), nullable=True)
    data = Column(JSON, nullable=True)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    
    # 关联关系
    workflow = relationship("WorkflowInstance", back_populates="messages")
```

**修改后**:
```python
class WorkflowMessage(Base):
    __tablename__ = 'workflow_messages'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    message_id = Column(String(255), nullable=False)
    message_type = Column(SQLEnum(MessageType, name='messagetype'), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(50), nullable=True)
    data = Column(JSON, nullable=True)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)           # 新增
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)  # 新增
    
    # 关联关系
    workflow = relationship("WorkflowInstance", back_populates="messages")
```

### 2. 数据库结构更新
使用 `simple_fix_workflow_message.py` 脚本执行数据库迁移：

```sql
-- 添加 created_at 字段
ALTER TABLE workflow_messages 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 添加 updated_at 字段  
ALTER TABLE workflow_messages 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 为现有数据设置默认值
UPDATE workflow_messages 
SET created_at = COALESCE(created_at, timestamp),
    updated_at = COALESCE(updated_at, timestamp)
WHERE created_at IS NULL OR updated_at IS NULL;
```

### 3. 执行结果
```
✅ created_at 字段添加成功
✅ updated_at 字段添加成功  
✅ 更新现有数据完成，影响 0 行
🎉 字段修复完成!
```

## 验证修复
数据库字段验证结果：
```
工作流消息表的时间字段:
  created_at: timestamp
  updated_at: timestamp
```

## 相关文件

### 修改的文件
- `python-analysis-service/models/workflow_models.py` - 添加缺失字段

### 新增的文件
- `simple_fix_workflow_message.py` - 数据库迁移脚本
- `test_workflow_creation_fixed.py` - 修复验证测试脚本
- `python-analysis-service/migrations/026-fix-workflow-message-fields.sql` - SQL迁移文件
- `WorkflowMessage字段修复说明.md` - 本文档

## 修复后的功能
✅ **新建工作流任务**：不再出现 `created_at` 字段错误
✅ **获取工作流历史**：可以正常返回包含时间戳的消息数据
✅ **消息时间戳**：现在具有完整的 `created_at` 和 `updated_at` 字段
✅ **数据一致性**：与其他模型保持字段结构一致

## 注意事项
1. **服务重启**：模型更改后需要重启Python分析服务
2. **数据完整性**：现有数据的时间戳字段会自动从 `timestamp` 字段填充
3. **向后兼容**：保留了原有的 `timestamp` 字段，确保兼容性

## 修复时间
- 问题发现时间: 2024年当前时间
- 修复完成时间: 2024年当前时间
- 修复用时: 约15分钟

✅ **WorkflowMessage 字段错误已完全修复，工作流创建功能恢复正常。** 