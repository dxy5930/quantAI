#!/usr/bin/env python3
"""
测试工作流相关API的连通性
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_api_endpoint(method, url, data=None, description=""):
    """测试API端点"""
    try:
        print(f"\n🔄 测试: {description}")
        print(f"📡 {method} {url}")
        
        if method.upper() == "GET":
            response = requests.get(url, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, timeout=5)
        else:
            print(f"❌ 不支持的HTTP方法: {method}")
            return False
            
        print(f"📊 状态码: {response.status_code}")
        
        if response.status_code < 400:
            print(f"✅ 成功")
            if response.content:
                try:
                    result = response.json()
                    print(f"📋 响应: {json.dumps(result, ensure_ascii=False, indent=2)[:200]}...")
                except:
                    print(f"📋 响应: {response.text[:200]}...")
            return True
        else:
            print(f"❌ 失败: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 连接错误: 无法连接到 {url}")
        return False
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试工作流API...")
    
    # 测试健康检查
    success_count = 0
    total_tests = 0
    
    # 1. 健康检查
    total_tests += 1
    if test_api_endpoint("GET", f"{BASE_URL}/health", description="健康检查"):
        success_count += 1
    
    # 2. 获取工作流列表 (持久化API)
    total_tests += 1
    if test_api_endpoint("GET", f"{BASE_URL}/api/v1/workflows", description="获取工作流列表"):
        success_count += 1
    
    # 3. 创建工作流 (持久化API)
    total_tests += 1
    test_data = {
        "title": "测试工作流",
        "description": "这是一个API测试工作流",
        "user_id": "test_user"
    }
    if test_api_endpoint("POST", f"{BASE_URL}/api/v1/workflows", test_data, "创建工作流"):
        success_count += 1
    
    # 4. 获取已删除的工作流 (软删除API)
    total_tests += 1
    if test_api_endpoint("GET", f"{BASE_URL}/api/workflow/workflows/deleted", description="获取已删除工作流"):
        success_count += 1
    
    # 5. 测试AI工作流API
    total_tests += 1
    if test_api_endpoint("GET", f"{BASE_URL}/api/v1/ai-workflow/health", description="AI工作流健康检查"):
        success_count += 1
    
    # 输出测试结果
    print(f"\n📊 测试完成!")
    print(f"✅ 成功: {success_count}/{total_tests}")
    print(f"❌ 失败: {total_tests - success_count}/{total_tests}")
    
    if success_count == total_tests:
        print("🎉 所有测试通过!")
        return 0
    else:
        print("⚠️ 部分测试失败")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 