#!/usr/bin/env python3
"""
实时工作流功能测试脚本
测试SSE推送机制是否正常工作
"""

import requests
import json
import time
from datetime import datetime

def test_realtime_workflow():
    """测试实时工作流功能"""
    
    base_url = "http://localhost:8000"
    
    print("🚀 开始测试实时工作流功能")
    print("=" * 50)
    
    # 1. 创建测试工作流
    print("1. 创建测试工作流...")
    create_response = requests.post(f"{base_url}/api/v1/workflows", json={
        "title": "实时功能测试",
        "description": "测试SSE推送和实时更新功能",
        "user_id": "test_user"
    })
    
    if create_response.status_code != 200:
        print(f"❌ 创建工作流失败: {create_response.text}")
        return
    
    workflow_data = create_response.json()
    workflow_id = workflow_data["id"]
    print(f"✅ 工作流创建成功，ID: {workflow_id}")
    
    # 2. 启动流式对话测试
    print("\n2. 启动流式对话测试...")
    
    # 构建SSE请求URL
    sse_url = f"{base_url}/api/v1/chat/stream"
    params = {
        "message": "分析一下腾讯控股的投资价值",
        "conversation_id": f"test_conv_{int(time.time())}",
        "context": json.dumps({}),
        "workflow_id": workflow_id
    }
    
    print(f"📡 连接SSE: {sse_url}")
    print(f"📋 参数: {params}")
    
    try:
        # 发送SSE请求
        response = requests.get(sse_url, params=params, stream=True, timeout=60)
        
        if response.status_code != 200:
            print(f"❌ SSE连接失败: {response.status_code} {response.text}")
            return
        
        print("✅ SSE连接建立成功")
        print("\n📨 开始接收实时消息:")
        print("-" * 40)
        
        message_count = 0
        resource_update_count = 0
        
        for line in response.iter_lines(decode_unicode=True):
            if line.startswith('data: '):
                try:
                    data = json.loads(line[6:])  # 去掉 'data: ' 前缀
                    message_count += 1
                    
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    msg_type = data.get('type', 'unknown')
                    
                    if msg_type == 'resource_updated':
                        resource_update_count += 1
                        trigger = data.get('trigger', 'unknown')
                        message_id = data.get('messageId', 'unknown')
                        print(f"🔄 [{timestamp}] 资源更新推送 #{resource_update_count}")
                        print(f"   触发器: {trigger}")
                        print(f"   消息ID: {message_id}")
                        print()
                    elif msg_type == 'progress':
                        step = data.get('step', 0)
                        content = data.get('content', '')[:50]
                        print(f"⚡ [{timestamp}] 步骤 {step}: {content}...")
                    elif msg_type == 'content':
                        content = data.get('content', '')[:50]
                        if content.strip():
                            print(f"💬 [{timestamp}] AI内容: {content}...")
                    elif msg_type == 'complete':
                        print(f"✅ [{timestamp}] 对话完成")
                        break
                    elif msg_type == 'error':
                        error = data.get('error', 'unknown')
                        print(f"❌ [{timestamp}] 错误: {error}")
                        break
                    
                except json.JSONDecodeError as e:
                    print(f"⚠️  JSON解析失败: {e}, 原始数据: {line}")
                except Exception as e:
                    print(f"⚠️  处理消息失败: {e}")
        
        print("-" * 40)
        print(f"📊 测试完成统计:")
        print(f"   总消息数: {message_count}")
        print(f"   资源更新推送数: {resource_update_count}")
        
        if resource_update_count > 0:
            print("✅ 实时推送功能正常工作！")
        else:
            print("⚠️  未收到资源更新推送，功能可能有问题")
            
    except requests.RequestException as e:
        print(f"❌ 网络请求失败: {e}")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
    
    # 3. 验证消息是否已保存到数据库
    print(f"\n3. 验证数据库中的消息...")
    try:
        messages_response = requests.get(f"{base_url}/api/v1/workflows/{workflow_id}/messages")
        if messages_response.status_code == 200:
            messages = messages_response.json()
            print(f"✅ 数据库中共有 {len(messages)} 条消息")
            
            # 统计消息类型
            message_types = {}
            for msg in messages:
                msg_type = msg.get('message_type', 'unknown')
                message_types[msg_type] = message_types.get(msg_type, 0) + 1
            
            print("📋 消息类型统计:")
            for msg_type, count in message_types.items():
                print(f"   {msg_type}: {count} 条")
        else:
            print(f"❌ 获取消息失败: {messages_response.text}")
    except Exception as e:
        print(f"❌ 验证数据库失败: {e}")
    
    # 4. 验证工作流资源是否已保存
    print(f"\n4. 验证数据库中的资源...")
    try:
        resources_response = requests.get(f"{base_url}/api/v1/workflows/{workflow_id}/resources")
        if resources_response.status_code == 200:
            resources = resources_response.json()
            print(f"✅ 数据库中共有 {len(resources)} 个资源")
            
            if len(resources) > 0:
                print("📦 资源类型统计:")
                resource_types = {}
                for resource in resources:
                    resource_type = resource.get('resource_type', 'unknown')
                    resource_types[resource_type] = resource_types.get(resource_type, 0) + 1
                
                for resource_type, count in resource_types.items():
                    print(f"   {resource_type}: {count} 个")
                
                # 显示前几个资源的详情
                print("\n📋 资源详情示例:")
                for i, resource in enumerate(resources[:3]):
                    print(f"   {i+1}. {resource.get('title', '未知标题')}")
                    print(f"      类型: {resource.get('resource_type', 'unknown')}")
                    print(f"      描述: {resource.get('description', '无描述')[:50]}...")
            else:
                print("⚠️  没有找到资源，这解释了为什么没有资源更新推送")
        else:
            print(f"❌ 获取资源失败: {resources_response.text}")
    except Exception as e:
        print(f"❌ 验证资源失败: {e}")
    
    print("\n🎉 测试完成！")

if __name__ == "__main__":
    test_realtime_workflow() 