#!/usr/bin/env python3
"""
测试工作流持久化功能
"""

import requests
import json
import time
import uuid

# API配置
BASE_URL = "http://localhost:8000"
WORKFLOW_API_URL = f"{BASE_URL}/api/v1/workflows"
CHAT_API_URL = f"{BASE_URL}/api/v1/chat"

def test_workflow_persistence():
    """测试工作流持久化功能"""
    print("开始测试工作流持久化功能...")
    
    # 1. 创建新的工作流
    print("\n1. 创建新的工作流...")
    create_data = {
        "title": "测试工作流持久化",
        "description": "测试所有步骤、记录、对话的持久化保存",
        "user_id": "test_user_123"
    }
    
    try:
        response = requests.post(WORKFLOW_API_URL, json=create_data)
        response.raise_for_status()
        workflow_data = response.json()
        workflow_id = workflow_data["id"]
        print(f"✅ 工作流创建成功，ID: {workflow_id}")
    except Exception as e:
        print(f"❌ 创建工作流失败: {e}")
        return False
    
    # 2. 模拟流式聊天对话
    print(f"\n2. 模拟流式聊天对话...")
    
    messages = [
        "分析一下当前A股市场的投资机会",
        "推荐几只科技股",
        "制定一个风险较低的投资策略"
    ]
    
    for i, message in enumerate(messages, 1):
        print(f"\n  发送消息 {i}: {message}")
        
        # 发送流式聊天请求
        chat_url = f"{CHAT_API_URL}/stream"
        params = {
            "message": message,
            "conversation_id": f"conv_{workflow_id}",
            "workflow_id": workflow_id,
            "context": json.dumps({"test": True})
        }
        
        try:
            # 使用SSE来接收流式响应
            response = requests.get(chat_url, params=params, stream=True)
            response.raise_for_status()
            
            step_count = 0
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]  # 移除 'data: ' 前缀
                        try:
                            data = json.loads(data_str)
                            if data.get('type') == 'progress':
                                step_count += 1
                                print(f"    步骤 {data.get('step', '?')}: {data.get('content', '无内容')}")
                            elif data.get('type') == 'complete':
                                print(f"    ✅ 消息 {i} 处理完成，共生成 {step_count} 个步骤")
                                break
                        except json.JSONDecodeError:
                            pass
                            
        except Exception as e:
            print(f"    ❌ 发送消息失败: {e}")
            
        # 等待一段时间再发送下一条消息
        time.sleep(2)
    
    # 3. 获取工作流历史
    print(f"\n3. 获取工作流历史...")
    try:
        history_url = f"{WORKFLOW_API_URL}/{workflow_id}/history"
        response = requests.get(history_url)
        response.raise_for_status()
        history_data = response.json()
        
        print(f"✅ 获取历史成功:")
        print(f"  - 工作流状态: {history_data.get('workflow', {}).get('status', '未知')}")
        print(f"  - 总步骤数: {len(history_data.get('steps', []))}")
        print(f"  - 消息数量: {len(history_data.get('messages', []))}")
        
        # 显示步骤详情
        steps = history_data.get('steps', [])
        if steps:
            print(f"\n  步骤详情:")
            for step in steps[:5]:  # 只显示前5个步骤
                print(f"    步骤 {step['step_number']}: {step['content'][:50]}...")
        
        # 显示消息详情
        messages = history_data.get('messages', [])
        if messages:
            print(f"\n  消息详情:")
            for msg in messages[:3]:  # 只显示前3条消息
                print(f"    {msg['message_type']}: {msg['content'][:50]}...")
                
    except Exception as e:
        print(f"❌ 获取工作流历史失败: {e}")
        return False
    
    # 4. 验证数据完整性
    print(f"\n4. 验证数据完整性...")
    
    # 检查是否有步骤被保存
    if len(history_data.get('steps', [])) > 0:
        print("✅ 步骤数据保存成功")
    else:
        print("❌ 没有找到保存的步骤数据")
        
    # 检查是否有消息被保存
    if len(history_data.get('messages', [])) > 0:
        print("✅ 消息数据保存成功")
    else:
        print("❌ 没有找到保存的消息数据")
    
    print(f"\n✅ 工作流持久化功能测试完成!")
    print(f"测试工作流ID: {workflow_id}")
    return True

if __name__ == "__main__":
    test_workflow_persistence() 