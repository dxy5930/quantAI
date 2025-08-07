#!/usr/bin/env python3
"""
测试工作流API连接性的脚本
"""

import requests
import json
import time

def test_api_endpoint(url, method='GET', data=None, headers=None):
    """测试API端点"""
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=headers, timeout=5)
        
        print(f"{method} {url} -> {response.status_code}")
        if response.status_code < 400:
            print(f"✅ 成功: {response.status_code}")
            return True, response.json() if response.content else {}
        else:
            print(f"❌ 失败: {response.status_code} - {response.text}")
            return False, None
    except requests.exceptions.ConnectionError:
        print(f"❌ 连接失败: 无法连接到 {url}")
        return False, None
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        return False, None

def main():
    """主测试函数"""
    base_url = "http://localhost:8000"
    
    print("🔍 测试工作流API连接性...")
    print("=" * 50)
    
    # 1. 测试健康检查
    print("\n1. 测试健康检查:")
    test_api_endpoint(f"{base_url}/health")
    
    # 2. 测试工作流持久化API
    print("\n2. 测试工作流API:")
    test_api_endpoint(f"{base_url}/api/v1/workflows")
    
    # 3. 测试软删除API
    print("\n3. 测试软删除API:")
    test_api_endpoint(f"{base_url}/api/workflow/workflows/deleted")
    
    # 4. 测试创建工作流
    print("\n4. 测试创建工作流:")
    success, workflow_data = test_api_endpoint(
        f"{base_url}/api/v1/workflows",
        method='POST',
        data={
            "title": "测试工作流",
            "description": "API连接性测试",
            "user_id": "test_user"
        }
    )
    
    if success and workflow_data:
        workflow_id = workflow_data.get('id')
        print(f"   创建的工作流ID: {workflow_id}")
        
        # 5. 测试获取工作流详情
        print("\n5. 测试获取工作流详情:")
        test_api_endpoint(f"{base_url}/api/v1/workflows/{workflow_id}")
        
        # 6. 测试软删除
        print("\n6. 测试软删除工作流:")
        test_api_endpoint(
            f"{base_url}/api/workflow/workflows/{workflow_id}/soft-delete",
            method='POST'
        )
    
    print("\n" + "=" * 50)
    print("✅ API连接性测试完成")

if __name__ == "__main__":
    main() 