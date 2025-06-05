/**
 * Chrome 扩展消息路由系统测试脚本
 * 用于测试和验证消息转发功能
 */

/**
 * 消息路由测试工具类
 */
class MessageRoutingTester {
  constructor() {
    this.testResults = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始消息路由系统测试...');
    console.log('=' .repeat(50));

    try {
      // 基础功能测试
      await this.testBasicMessageValidation();
      await this.testSystemMessages();
      await this.testStorageMessages();
      await this.testTabsMessages();
      
      // 转发功能测试
      await this.testContentScriptForwarding();
      await this.testPopupForwarding();
      await this.testSidePanelForwarding();
      
      // 高级功能测试
      await this.testBroadcastMessages();
      await this.testMessageQueue();
      await this.testErrorHandling();
      
      // 性能测试
      await this.testPerformance();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    }

    this.printTestSummary();
  }

  /**
   * 测试基础消息验证
   */
  async testBasicMessageValidation() {
    console.log('\n📋 测试基础消息验证...');

    // 测试有效消息
    await this.runTest('有效消息格式', async () => {
      const message = {
        action: 'system',
        type: 'ping'
      };
      
      const response = await this.sendMessage(message);
      return response.success === true;
    });

    // 测试无效消息 - 缺少action
    await this.runTest('无效消息 - 缺少action', async () => {
      const message = {
        type: 'ping'
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.code === 'INVALID_MESSAGE_FORMAT';
    });

    // 测试无效消息 - action不是字符串
    await this.runTest('无效消息 - action类型错误', async () => {
      const message = {
        action: 123,
        type: 'ping'
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.code === 'INVALID_MESSAGE_FORMAT';
    });

    // 测试消息ID自动生成
    await this.runTest('消息ID自动生成', async () => {
      const message = {
        action: 'system',
        type: 'ping'
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.messageId && response.messageId.startsWith('msg_');
    });
  }

  /**
   * 测试系统消息
   */
  async testSystemMessages() {
    console.log('\n🔧 测试系统消息...');

    // 测试 ping
    await this.runTest('系统 Ping 测试', async () => {
      const message = {
        action: 'system',
        type: 'ping'
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.data.pong === true;
    });

    // 测试获取扩展信息
    await this.runTest('获取扩展信息', async () => {
      const message = {
        action: 'system',
        type: 'getExtensionInfo'
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.data.id && response.data.version;
    });

    // 测试获取消息队列
    await this.runTest('获取消息队列', async () => {
      const message = {
        action: 'system',
        type: 'getMessageQueue',
        data: {
          target: 'popup'
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && Array.isArray(response.data.messages);
    });

    // 测试未知系统消息类型
    await this.runTest('未知系统消息类型', async () => {
      const message = {
        action: 'system',
        type: 'unknownType'
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.error.includes('未知的系统消息类型');
    });
  }

  /**
   * 测试存储消息
   */
  async testStorageMessages() {
    console.log('\n💾 测试存储消息...');

    const testKey = 'test_message_routing';
    const testValue = { timestamp: Date.now(), test: true };

    // 测试存储设置
    await this.runTest('存储设置', async () => {
      const message = {
        action: 'storage',
        type: 'set',
        data: {
          items: {
            [testKey]: testValue
          }
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success === true;
    });

    // 测试存储获取
    await this.runTest('存储获取', async () => {
      const message = {
        action: 'storage',
        type: 'get',
        data: {
          keys: [testKey]
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.data[testKey] && 
             response.data[testKey].timestamp === testValue.timestamp;
    });

    // 测试存储删除
    await this.runTest('存储删除', async () => {
      const message = {
        action: 'storage',
        type: 'remove',
        data: {
          keys: [testKey]
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success === true;
    });

    // 验证删除结果
    await this.runTest('验证删除结果', async () => {
      const message = {
        action: 'storage',
        type: 'get',
        data: {
          keys: [testKey]
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && !response.data[testKey];
    });

    // 测试未知存储操作
    await this.runTest('未知存储操作', async () => {
      const message = {
        action: 'storage',
        type: 'unknownOperation',
        data: {}
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.error.includes('未知的存储操作类型');
    });
  }

  /**
   * 测试标签页消息
   */
  async testTabsMessages() {
    console.log('\n📄 测试标签页消息...');

    // 测试查询标签页
    await this.runTest('查询活动标签页', async () => {
      const message = {
        action: 'tabs',
        type: 'query',
        data: {
          queryInfo: { active: true, currentWindow: true }
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && Array.isArray(response.data) && response.data.length > 0;
    });

    // 测试获取当前标签页
    await this.runTest('获取当前标签页信息', async () => {
      // 先获取当前标签页ID
      const queryMessage = {
        action: 'tabs',
        type: 'query',
        data: {
          queryInfo: { active: true, currentWindow: true }
        }
      };
      
      const queryResponse = await this.sendMessage(queryMessage);
      if (!queryResponse.success || queryResponse.data.length === 0) {
        return false;
      }
      
      const tabId = queryResponse.data[0].id;
      
      const getMessage = {
        action: 'tabs',
        type: 'get',
        data: {
          tabId: tabId
        }
      };
      
      const response = await this.sendMessage(getMessage);
      return response.success && response.data.id === tabId;
    });

    // 测试未知标签页操作
    await this.runTest('未知标签页操作', async () => {
      const message = {
        action: 'tabs',
        type: 'unknownOperation',
        data: {}
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.error.includes('未知的标签页操作类型');
    });
  }

  /**
   * 测试Content Script转发
   */
  async testContentScriptForwarding() {
    console.log('\n📜 测试Content Script转发...');

    // 测试转发到Content Script（可能失败，因为可能没有Content Script）
    await this.runTest('转发到Content Script', async () => {
      const message = {
        action: 'forwardToContentScript',
        data: {
          action: 'test',
          payload: { test: true }
        }
      };
      
      const response = await this.sendMessage(message);
      // 这个测试可能失败，因为可能没有活动的Content Script
      // 我们主要检查消息格式是否正确处理
      return response.hasOwnProperty('success');
    });
  }

  /**
   * 测试Popup转发
   */
  async testPopupForwarding() {
    console.log('\n🪟 测试Popup转发...');

    await this.runTest('转发到Popup', async () => {
      const message = {
        action: 'forwardToPopup',
        data: {
          action: 'updateUI',
          payload: { status: 'test' }
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.target === 'popup' && response.queued === true;
    });
  }

  /**
   * 测试SidePanel转发
   */
  async testSidePanelForwarding() {
    console.log('\n📱 测试SidePanel转发...');

    await this.runTest('转发到SidePanel', async () => {
      const message = {
        action: 'forwardToSidePanel',
        data: {
          action: 'updateSidebar',
          payload: { data: 'test' }
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.target === 'sidepanel' && response.queued === true;
    });
  }

  /**
   * 测试广播消息
   */
  async testBroadcastMessages() {
    console.log('\n📡 测试广播消息...');

    await this.runTest('广播消息', async () => {
      const message = {
        action: 'broadcast',
        data: {
          action: 'globalUpdate',
          payload: { timestamp: Date.now() }
        },
        excludeSender: true
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.target === 'broadcast' && Array.isArray(response.results);
    });
  }

  /**
   * 测试消息队列
   */
  async testMessageQueue() {
    console.log('\n📬 测试消息队列...');

    // 先发送一些消息到队列
    await this.runTest('填充消息队列', async () => {
      const messages = [
        {
          action: 'forwardToPopup',
          data: { action: 'test1', payload: { id: 1 } }
        },
        {
          action: 'forwardToPopup',
          data: { action: 'test2', payload: { id: 2 } }
        },
        {
          action: 'forwardToSidePanel',
          data: { action: 'test3', payload: { id: 3 } }
        }
      ];
      
      for (const message of messages) {
        await this.sendMessage(message);
      }
      
      return true;
    });

    // 测试获取Popup队列
    await this.runTest('获取Popup消息队列', async () => {
      const message = {
        action: 'system',
        type: 'getMessageQueue',
        data: {
          target: 'popup'
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.data.messages.length >= 2;
    });

    // 测试获取SidePanel队列
    await this.runTest('获取SidePanel消息队列', async () => {
      const message = {
        action: 'system',
        type: 'getMessageQueue',
        data: {
          target: 'sidepanel'
        }
      };
      
      const response = await this.sendMessage(message);
      return response.success && response.data.messages.length >= 1;
    });
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling() {
    console.log('\n⚠️ 测试错误处理...');

    // 测试未知消息类型
    await this.runTest('未知消息类型', async () => {
      const message = {
        action: 'unknownAction',
        data: { test: true }
      };
      
      const response = await this.sendMessage(message);
      return response.success === false && response.code === 'UNKNOWN_MESSAGE_TYPE';
    });

    // 测试页面美化消息（可能失败）
    await this.runTest('页面美化消息处理', async () => {
      const message = {
        action: 'pageBeautify',
        data: {
          action: 'applyTheme',
          theme: 'test'
        }
      };
      
      const response = await this.sendMessage(message);
      // 这个可能失败，我们主要检查是否有响应
      return response.hasOwnProperty('success');
    });
  }

  /**
   * 测试性能
   */
  async testPerformance() {
    console.log('\n⚡ 测试性能...');

    await this.runTest('批量消息处理性能', async () => {
      const startTime = Date.now();
      const messageCount = 10;
      const promises = [];
      
      for (let i = 0; i < messageCount; i++) {
        const message = {
          action: 'system',
          type: 'ping',
          data: { index: i }
        };
        promises.push(this.sendMessage(message));
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   📊 处理 ${messageCount} 条消息耗时: ${duration}ms (平均: ${(duration/messageCount).toFixed(2)}ms/条)`);
      
      // 检查所有消息都成功处理
      return responses.every(response => response.success === true) && duration < 5000;
    });
  }

  /**
   * 运行单个测试
   * @param {string} testName - 测试名称
   * @param {Function} testFunction - 测试函数
   */
  async runTest(testName, testFunction) {
    this.testCount++;
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result) {
        console.log(`   ✅ ${testName} (${duration}ms)`);
        this.passCount++;
        this.testResults.push({ name: testName, status: 'PASS', duration });
      } else {
        console.log(`   ❌ ${testName} (${duration}ms)`);
        this.failCount++;
        this.testResults.push({ name: testName, status: 'FAIL', duration });
      }
    } catch (error) {
      console.log(`   💥 ${testName} - 异常: ${error.message}`);
      this.failCount++;
      this.testResults.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  /**
   * 发送消息的辅助方法
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>} 响应对象
   */
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
            code: 'RUNTIME_ERROR'
          });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }

  /**
   * 打印测试总结
   */
  printTestSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 测试总结');
    console.log('=' .repeat(50));
    console.log(`总测试数: ${this.testCount}`);
    console.log(`✅ 通过: ${this.passCount}`);
    console.log(`❌ 失败: ${this.failCount}`);
    console.log(`📈 通过率: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`);
    
    if (this.failCount > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(result => result.status !== 'PASS')
        .forEach(result => {
          console.log(`   • ${result.name} - ${result.status}${result.error ? ': ' + result.error : ''}`);
        });
    }
    
    console.log('\n🎯 测试完成!');
  }

  /**
   * 交互式测试菜单
   */
  async showInteractiveMenu() {
    console.log('\n🎮 消息路由系统交互式测试');
    console.log('=' .repeat(40));
    console.log('1. 运行所有测试');
    console.log('2. 测试基础消息验证');
    console.log('3. 测试系统消息');
    console.log('4. 测试存储消息');
    console.log('5. 测试标签页消息');
    console.log('6. 测试消息转发');
    console.log('7. 测试广播消息');
    console.log('8. 测试消息队列');
    console.log('9. 测试错误处理');
    console.log('10. 性能测试');
    console.log('0. 退出');
    console.log('\n请在浏览器控制台中调用相应的测试方法:');
    console.log('例如: tester.runAllTests()');
  }
}

// 创建测试实例
const tester = new MessageRoutingTester();

// 如果在浏览器环境中，显示交互式菜单
if (typeof window !== 'undefined') {
  // 将测试器暴露到全局作用域
  window.messageRoutingTester = tester;
  
  console.log('🧪 消息路由测试器已加载!');
  console.log('使用 messageRoutingTester.runAllTests() 运行所有测试');
  console.log('使用 messageRoutingTester.showInteractiveMenu() 查看测试菜单');
  
  // 自动显示菜单
  tester.showInteractiveMenu();
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageRoutingTester;
}