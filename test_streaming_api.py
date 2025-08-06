#!/usr/bin/env python3
"""
测试流式API功能
"""

import requests
import json
import time
from urllib.parse import urlencode

def test_streaming_api():
    """测试流式对话API"""
    
    # 测试参数
    params = {
        'message': '帮我分析一下当前的市场形势',
        'conversation_id': 'test-conv-123',
        'context': '{"workflowId": "test-workflow"}'
    }
    
    # 构建URL
    base_url = "http://localhost:8000/api/chat/stream"
    url = f"{base_url}?{urlencode(params)}"
    
    print(f"🚀 测试流式API: {url}")
    print("=" * 60)
    
    try:
        # 发送请求
        response = requests.get(url, stream=True, timeout=30)
        
        if response.status_code == 200:
            print("✅ 连接成功，开始接收流式数据:")
            print("-" * 40)
            
            # 逐行读取流式数据
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    # 解析SSE格式数据
                    if line.startswith('data: '):
                        data_str = line[6:]  # 去掉 'data: ' 前缀
                        try:
                            data = json.loads(data_str)
                            
                            # 根据类型显示不同格式
                            if data['type'] == 'start':
                                print(f"🎬 开始: {data.get('messageId', 'N/A')}")
                            elif data['type'] == 'progress':
                                print(f"⏳ 进度 ({data.get('step', 0)}/{data.get('totalSteps', 0)}): {data.get('content', '')}")
                            elif data['type'] == 'content':
                                print(f"📝 内容: {data.get('content', '')}")
                            elif data['type'] == 'complete':
                                print(f"✅ 完成: {data.get('messageId', 'N/A')}")
                                break
                            elif data['type'] == 'error':
                                print(f"❌ 错误: {data.get('error', 'Unknown error')}")
                                break
                                
                        except json.JSONDecodeError as e:
                            print(f"⚠️  JSON解析错误: {e}")
                            print(f"原始数据: {data_str}")
                    
                    time.sleep(0.1)  # 小延迟以便观察
            
            print("-" * 40)
            print("🎉 测试完成!")
            
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败! 请确保后端服务正在运行在 http://localhost:8000")
    except requests.exceptions.Timeout:
        print("❌ 请求超时!")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

def test_different_message_types():
    """测试不同类型的消息"""
    
    test_messages = [
        "帮我分析苹果股票",  # 分析类
        "给我推荐一些投资策略",  # 策略类
        "你好，我想了解股市情况"  # 通用类
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{'='*60}")
        print(f"测试 {i}: {message}")
        print('='*60)
        
        params = {
            'message': message,
            'conversation_id': f'test-conv-{i}',
            'context': '{"workflowId": "test-workflow"}'
        }
        
        base_url = "http://localhost:8000/api/chat/stream"
        url = f"{base_url}?{urlencode(params)}"
        
        try:
            response = requests.get(url, stream=True, timeout=15)
            
            if response.status_code == 200:
                for line in response.iter_lines(decode_unicode=True):
                    if line and line.startswith('data: '):
                        data_str = line[6:]
                        try:
                            data = json.loads(data_str)
                            if data['type'] == 'content':
                                print(f"📝 {data.get('content', '')}")
                            elif data['type'] == 'complete':
                                break
                        except:
                            continue
            else:
                print(f"❌ HTTP错误: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 测试失败: {e}")
        
        time.sleep(1)  # 测试之间的间隔

if __name__ == "__main__":
    print("🧪 流式API测试工具")
    print("确保后端服务正在运行: python python-analysis-service/main.py")
    print()
    
    # 基础测试
    test_streaming_api()
    
    # 等待用户确认是否继续
    try:
        input("\n按回车键继续测试不同消息类型，或Ctrl+C退出...")
        test_different_message_types()
    except KeyboardInterrupt:
        print("\n👋 测试结束!") 