#!/usr/bin/env python3
"""
清理测试数据的脚本
"""

import requests
import json

def cleanup_test_workflows():
    """清理测试工作流"""
    base_url = "http://localhost:8000"
    
    try:
        # 获取所有工作流
        response = requests.get(f"{base_url}/api/v1/workflows")
        if response.status_code == 200:
            workflows = response.json()
            
            test_workflows = [w for w in workflows if '测试' in w.get('title', '') or 'test' in w.get('title', '').lower()]
            
            print(f"找到 {len(test_workflows)} 个测试工作流，开始清理...")
            
            for workflow in test_workflows:
                workflow_id = workflow['id']
                title = workflow['title']
                
                # 软删除测试工作流
                delete_response = requests.post(f"{base_url}/api/workflow/workflows/{workflow_id}/soft-delete")
                if delete_response.status_code == 200:
                    print(f"✅ 已删除: {title}")
                else:
                    print(f"❌ 删除失败: {title}")
            
            print("✅ 清理完成")
        else:
            print(f"❌ 获取工作流列表失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 清理过程中出错: {e}")

if __name__ == "__main__":
    cleanup_test_workflows() 