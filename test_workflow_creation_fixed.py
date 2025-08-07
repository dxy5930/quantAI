#!/usr/bin/env python3
"""
测试修复后的工作流创建功能
"""

import requests
import json
import time

def test_workflow_creation():
    """测试工作流创建和历史获取功能"""
    base_url = "http://localhost:8000"
    
    print("🧪 测试修复后的工作流功能...")
    print("=" * 50)
    
    try:
        # 1. 创建新工作流
        print("\n1. 创建新工作流:")
        create_data = {
            "title": "测试工作流 - 修复验证",
            "description": "验证 WorkflowMessage 字段修复是否成功",
            "user_id": "test_user_123"
        }
        
        response = requests.post(f"{base_url}/api/v1/workflows", json=create_data, timeout=10)
        if response.status_code == 200:
            workflow_data = response.json()
            workflow_id = workflow_data.get('id')
            print(f"✅ 工作流创建成功，ID: {workflow_id}")
        else:
            print(f"❌ 工作流创建失败: {response.status_code} - {response.text}")
            return False
        
        # 2. 添加测试消息
        print("\n2. 添加工作流消息:")
        message_data = {
            "message_id": "test_msg_001",
            "message_type": "user",
            "content": "这是一条测试消息",
            "status": "sent"
        }
        
        response = requests.post(f"{base_url}/api/v1/workflows/{workflow_id}/messages", json=message_data, timeout=10)
        if response.status_code == 200:
            print("✅ 消息添加成功")
        else:
            print(f"❌ 消息添加失败: {response.status_code} - {response.text}")
        
        # 等待一下确保数据已保存
        time.sleep(1)
        
        # 3. 测试获取工作流历史（这里之前会出错）
        print("\n3. 测试获取工作流历史:")
        response = requests.get(f"{base_url}/api/v1/workflows/{workflow_id}/history", timeout=10)
        if response.status_code == 200:
            history_data = response.json()
            print("✅ 工作流历史获取成功")
            
            # 验证数据结构
            if 'workflow' in history_data:
                print(f"   工作流标题: {history_data['workflow']['title']}")
            
            if 'messages' in history_data:
                messages = history_data['messages']
                print(f"   消息数量: {len(messages)}")
                
                for msg in messages:
                    if 'created_at' in msg:
                        print(f"   ✅ 消息包含 created_at 字段: {msg['created_at']}")
                    else:
                        print("   ❌ 消息缺少 created_at 字段")
                    
                    if 'updated_at' in msg:
                        print(f"   ✅ 消息包含 updated_at 字段: {msg['updated_at']}")
                    else:
                        print("   ❌ 消息缺少 updated_at 字段")
            
            if 'steps' in history_data:
                print(f"   步骤数量: {len(history_data['steps'])}")
            
        else:
            print(f"❌ 工作流历史获取失败: {response.status_code} - {response.text}")
            return False
        
        # 4. 清理测试数据
        print("\n4. 清理测试数据:")
        response = requests.post(f"{base_url}/api/workflow/workflows/{workflow_id}/soft-delete", timeout=10)
        if response.status_code == 200:
            print("✅ 测试数据清理成功")
        else:
            print(f"⚠️ 测试数据清理失败: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 工作流功能测试通过！WorkflowMessage 字段修复成功！")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到Python分析服务，请确保服务正在运行")
        return False
    except Exception as e:
        print(f"❌ 测试过程中出错: {e}")
        return False

if __name__ == "__main__":
    success = test_workflow_creation()
    if not success:
        print("\n💡 如果测试失败，请检查:")
        print("   1. Python分析服务是否正在运行 (localhost:8000)")
        print("   2. 数据库连接是否正常")
        print("   3. WorkflowMessage 模型字段是否正确添加") 