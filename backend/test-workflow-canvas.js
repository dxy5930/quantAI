const axios = require('axios');

// 测试工作流画布API
async function testWorkflowCanvas() {
  const baseURL = 'http://localhost:3001/api/v1';
  
  // 测试数据
  const testWorkflow = {
    name: "测试工作流",
    description: "这是一个测试工作流",
    nodes: [
      {
        id: "node1",
        type: "data",
        name: "数据收集",
        position: { x: 100, y: 100 },
        config: { dataSources: ["stock_price"] },
        inputs: [],
        outputs: ["raw_data"]
      },
      {
        id: "node2", 
        type: "analysis",
        name: "技术分析",
        position: { x: 300, y: 100 },
        config: { indicators: ["RSI", "MACD"] },
        inputs: ["raw_data"],
        outputs: ["signals"]
      }
    ],
    connections: [
      {
        id: "conn1",
        sourceId: "node1",
        targetId: "node2",
        sourcePort: "raw_data",
        targetPort: "raw_data"
      }
    ],
    tags: ["测试", "技术分析"],
    status: "draft"
  };

  try {
    console.log('=== 测试创建新工作流 ===');
    
    // 1. 创建新工作流
    const createResponse = await axios.post(`${baseURL}/ai-workflow/workflow/create`, {
      workflow: testWorkflow,
      userId: 'test-user-123'
    });
    
    console.log('创建工作流响应:', {
      success: createResponse.data.success,
      message: createResponse.data.message,
      workflowId: createResponse.data.data?.id,
      workflowName: createResponse.data.data?.name
    });

    if (createResponse.data.success) {
      const workflowId = createResponse.data.data.id;
      
      console.log('\n=== 测试更新工作流 ===');
      
      // 2. 更新工作流
      const updatedWorkflow = {
        ...testWorkflow,
        name: "更新后的测试工作流",
        description: "这是更新后的工作流描述",
        nodes: [
          ...testWorkflow.nodes,
          {
            id: "node3",
            type: "strategy", 
            name: "策略生成",
            position: { x: 500, y: 100 },
            config: { strategyType: "momentum" },
            inputs: ["signals"],
            outputs: ["strategy"]
          }
        ]
      };

      const updateResponse = await axios.put(`${baseURL}/ai-workflow/workflow/${workflowId}`, {
        workflow: updatedWorkflow,
        userId: 'test-user-123'
      });

      console.log('更新工作流响应:', {
        success: updateResponse.data.success,
        message: updateResponse.data.message,
        version: updateResponse.data.data?.version,
        nodeCount: updateResponse.data.data?.nodes?.length
      });

      console.log('\n=== 测试获取工作流 ===');
      
      // 3. 获取工作流
      const getResponse = await axios.get(`${baseURL}/ai-workflow/workflow/${workflowId}`);
      
      console.log('获取工作流响应:', {
        success: getResponse.data.success,
        workflowName: getResponse.data.data?.name,
        nodeCount: getResponse.data.data?.nodes?.length,
        version: getResponse.data.data?.version
      });

    }

    console.log('\n=== 测试无权限更新 ===');
    
    // 4. 测试无权限更新（使用不同的用户ID）
    try {
      await axios.put(`${baseURL}/ai-workflow/workflow/non-existent-id`, {
        workflow: testWorkflow,
        userId: 'different-user-456'
      });
    } catch (error) {
      console.log('无权限更新响应:', {
        status: error.response?.status,
        message: error.response?.data?.message
      });
    }

  } catch (error) {
    console.error('测试失败:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// 运行测试
testWorkflowCanvas();