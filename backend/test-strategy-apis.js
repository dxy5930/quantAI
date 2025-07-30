const axios = require('axios');

// 测试策略创建和更新API
async function testStrategyApis() {
  const baseURL = 'http://localhost:3001/api/v1';
  
  // 测试数据
  const testStrategy = {
    name: "测试选股策略",
    description: "这是一个测试选股策略",
    category: "自定义",
    strategyType: "stock_selection",
    difficulty: "medium",
    parameters: [],
    tags: ["测试", "选股"],
    isPublic: false,
    originalQuery: "寻找高成长科技股",
    keywords: [
      { text: "科技股", confidence: 0.9 },
      { text: "高成长", confidence: 0.8 }
    ],
    selectedStocks: [
      {
        symbol: "AAPL",
        name: "苹果公司",
        sector: "科技",
        marketCap: 3000000000000,
        score: 85,
        reason: "强劲的财务表现和创新能力"
      },
      {
        symbol: "MSFT", 
        name: "微软公司",
        sector: "科技",
        marketCap: 2800000000000,
        score: 82,
        reason: "云计算业务增长强劲"
      }
    ]
  };

  const testBacktestStrategy = {
    name: "测试回测策略",
    description: "这是一个测试回测策略",
    category: "回测策略",
    strategyType: "backtest",
    difficulty: "medium",
    parameters: [],
    tags: ["测试", "回测"],
    isPublic: false,
    positions: [
      {
        symbol: "AAPL",
        name: "苹果公司",
        weight: 0.4,
        sector: "科技"
      },
      {
        symbol: "MSFT",
        name: "微软公司", 
        weight: 0.3,
        sector: "科技"
      },
      {
        symbol: "GOOGL",
        name: "谷歌公司",
        weight: 0.3,
        sector: "科技"
      }
    ],
    backtestPeriod: {
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 100000,
      rebalanceFrequency: "monthly",
      commission: 0.001
    },
    defaultTradingRules: {
      stopLoss: 0.1,
      takeProfit: 0.2,
      maxPositions: 10
    }
  };

  try {
    console.log('=== 测试创建选股策略 ===');
    
    // 1. 创建选股策略
    const createStockResponse = await axios.post(`${baseURL}/strategies/create`, testStrategy);
    
    console.log('创建选股策略响应:', {
      success: createStockResponse.data.success,
      message: createStockResponse.data.message,
      strategyId: createStockResponse.data.data?.id,
      strategyName: createStockResponse.data.data?.name
    });

    if (createStockResponse.data.success) {
      const stockStrategyId = createStockResponse.data.data.id;
      
      console.log('\n=== 测试更新选股策略 ===');
      
      // 2. 更新选股策略
      const updatedStockStrategy = {
        ...testStrategy,
        name: "更新后的测试选股策略",
        description: "这是更新后的选股策略描述",
        selectedStocks: [
          ...testStrategy.selectedStocks,
          {
            symbol: "TSLA",
            name: "特斯拉公司",
            sector: "汽车",
            marketCap: 800000000000,
            score: 78,
            reason: "电动汽车领域的领导者"
          }
        ]
      };

      const updateStockResponse = await axios.put(`${baseURL}/strategies/${stockStrategyId}`, updatedStockStrategy);

      console.log('更新选股策略响应:', {
        success: updateStockResponse.data.success,
        message: updateStockResponse.data.message,
        stockCount: updateStockResponse.data.data?.selectedStocks?.length
      });
    }

    console.log('\n=== 测试创建回测策略 ===');
    
    // 3. 创建回测策略
    const createBacktestResponse = await axios.post(`${baseURL}/strategies/create`, testBacktestStrategy);
    
    console.log('创建回测策略响应:', {
      success: createBacktestResponse.data.success,
      message: createBacktestResponse.data.message,
      strategyId: createBacktestResponse.data.data?.id,
      strategyName: createBacktestResponse.data.data?.name
    });

    if (createBacktestResponse.data.success) {
      const backtestStrategyId = createBacktestResponse.data.data.id;
      
      console.log('\n=== 测试更新回测策略 ===');
      
      // 4. 更新回测策略
      const updatedBacktestStrategy = {
        ...testBacktestStrategy,
        name: "更新后的测试回测策略",
        description: "这是更新后的回测策略描述",
        positions: [
          ...testBacktestStrategy.positions,
          {
            symbol: "AMZN",
            name: "亚马逊公司",
            weight: 0.2,
            sector: "电商"
          }
        ]
      };

      const updateBacktestResponse = await axios.put(`${baseURL}/strategies/${backtestStrategyId}`, updatedBacktestStrategy);

      console.log('更新回测策略响应:', {
        success: updateBacktestResponse.data.success,
        message: updateBacktestResponse.data.message,
        positionCount: updateBacktestResponse.data.data?.positions?.length
      });
    }

    console.log('\n=== 测试无权限更新 ===');
    
    // 5. 测试无权限更新（使用不存在的策略ID）
    try {
      await axios.put(`${baseURL}/strategies/non-existent-id`, testStrategy);
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
testStrategyApis();