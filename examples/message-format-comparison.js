/**
 * Chrome 扩展消息格式对比示例
 * 展示新旧消息格式的差异和使用方法
 */

// ============================================================================
// 1. 消息格式对比
// ============================================================================

/**
 * 旧的消息格式（复杂，需要两个 action）
 */
const oldMessageFormat = {
  // Popup 发送到 Content Script
  popupToContent: {
    action: 'forwardToContentScript',  // 第一个 action：指定转发目标
    data: {
      action: 'pageBeautify.applyTheme', // 第二个 action：实际操作
      theme: 'dark',
      options: { animation: true }
    }
  },
  
  // Content Script 发送到 Popup
  contentToPopup: {
    action: 'forwardToPopup',          // 第一个 action：指定转发目标
    data: {
      action: 'themeApplied',          // 第二个 action：实际操作
      payload: { theme: 'dark', success: true }
    }
  },
  
  // 发送到侧栏
  toSidebar: {
    action: 'forwardToSidePanel',      // 第一个 action：指定转发目标
    data: {
      action: 'updateSidebar',         // 第二个 action：实际操作
      payload: { message: 'Hello' }
    }
  },
  
  // 广播消息
  broadcast: {
    action: 'broadcast',               // 第一个 action：指定转发目标
    data: {
      action: 'globalUpdate',          // 第二个 action：实际操作
      payload: { version: '1.0.0' }
    }
  }
};

/**
 * 新的消息格式（简化，只需要一个 action）
 */
const newMessageFormat = {
  // Popup 发送到 Content Script（自动识别）
  popupToContent: {
    action: 'message',                 // 统一的 action
    data: {
      action: 'pageBeautify.applyTheme', // 实际操作
      theme: 'dark',
      options: { animation: true }
    }
    // 系统自动识别发送者是 Popup，自动路由到 Content Script
  },
  
  // Content Script 发送到 Popup（自动识别）
  contentToPopup: {
    action: 'message',                 // 统一的 action
    data: {
      action: 'themeApplied',          // 实际操作
      payload: { theme: 'dark', success: true }
    }
    // 系统自动识别发送者是 Content Script，自动路由到 Popup
  },
  
  // 明确指定目标（可选）
  explicitTarget: {
    action: 'message',                 // 统一的 action
    target: 'sidepanel',               // 明确指定目标
    data: {
      action: 'updateSidebar',         // 实际操作
      payload: { message: 'Hello' }
    }
  },
  
  // 广播消息
  broadcast: {
    action: 'message',                 // 统一的 action
    target: 'broadcast',               // 明确指定广播
    data: {
      action: 'globalUpdate',          // 实际操作
      payload: { version: '1.0.0' }
    }
  }
};

// ============================================================================
// 2. 实际使用示例
// ============================================================================

/**
 * 统一的消息发送函数
 * @param {Object} data - 消息数据
 * @param {string} target - 可选的目标类型
 * @returns {Promise<Object>} 响应结果
 */
function sendMessage(data, target = null) {
  const message = {
    action: 'message',
    data: data,
    target: target,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!response || !response.success) {
        reject(new Error(response?.error || '未知错误'));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * 旧格式的消息发送函数（向后兼容）
 * @param {string} action - 转发动作
 * @param {Object} data - 消息数据
 * @returns {Promise<Object>} 响应结果
 */
function sendMessageOldFormat(action, data) {
  const message = {
    action: action,
    data: data,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!response || !response.success) {
        reject(new Error(response?.error || '未知错误'));
      } else {
        resolve(response);
      }
    });
  });
}

// ============================================================================
// 3. 使用场景对比
// ============================================================================

/**
 * 场景1：Popup 应用主题到页面
 */
class ThemeManager {
  /**
   * 新格式：简化的主题应用
   */
  async applyThemeNew(theme) {
    try {
      // 只需要一个 action，系统自动路由到 Content Script
      const response = await sendMessage({
        action: 'pageBeautify.applyTheme',
        theme: theme,
        options: {
          animation: true,
          duration: 300
        }
      });
      
      console.log('✅ 新格式 - 主题应用成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 新格式 - 主题应用失败:', error);
      throw error;
    }
  }
  
  /**
   * 旧格式：复杂的主题应用
   */
  async applyThemeOld(theme) {
    try {
      // 需要两个 action，手动指定转发目标
      const response = await sendMessageOldFormat('forwardToContentScript', {
        action: 'pageBeautify.applyTheme',
        theme: theme,
        options: {
          animation: true,
          duration: 300
        }
      });
      
      console.log('✅ 旧格式 - 主题应用成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 旧格式 - 主题应用失败:', error);
      throw error;
    }
  }
}

/**
 * 场景2：Content Script 发送页面分析结果
 */
class PageAnalyzer {
  /**
   * 新格式：简化的结果发送
   */
  async sendAnalysisResultNew(analysis) {
    try {
      // 只需要一个 action，系统自动路由到 Popup
      const response = await sendMessage({
        action: 'pageAnalyzed',
        payload: analysis
      });
      
      console.log('✅ 新格式 - 分析结果发送成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 新格式 - 分析结果发送失败:', error);
      throw error;
    }
  }
  
  /**
   * 旧格式：复杂的结果发送
   */
  async sendAnalysisResultOld(analysis) {
    try {
      // 需要两个 action，手动指定转发目标
      const response = await sendMessageOldFormat('forwardToPopup', {
        action: 'pageAnalyzed',
        payload: analysis
      });
      
      console.log('✅ 旧格式 - 分析结果发送成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 旧格式 - 分析结果发送失败:', error);
      throw error;
    }
  }
}

/**
 * 场景3：多目标消息发送
 */
class MultiTargetMessenger {
  /**
   * 新格式：明确指定目标
   */
  async sendToSpecificTargetNew(target, data) {
    try {
      const response = await sendMessage(data, target);
      console.log(`✅ 新格式 - 消息发送到 ${target} 成功:`, response);
      return response;
    } catch (error) {
      console.error(`❌ 新格式 - 消息发送到 ${target} 失败:`, error);
      throw error;
    }
  }
  
  /**
   * 新格式：广播消息
   */
  async broadcastMessageNew(data) {
    try {
      const response = await sendMessage(data, 'broadcast');
      console.log('✅ 新格式 - 广播消息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 新格式 - 广播消息失败:', error);
      throw error;
    }
  }
  
  /**
   * 旧格式：需要不同的 action
   */
  async sendToSpecificTargetOld(target, data) {
    const actionMap = {
      'content': 'forwardToContentScript',
      'popup': 'forwardToPopup',
      'sidepanel': 'forwardToSidePanel',
      'broadcast': 'broadcast'
    };
    
    const action = actionMap[target];
    if (!action) {
      throw new Error(`未知的目标类型: ${target}`);
    }
    
    try {
      const response = await sendMessageOldFormat(action, data);
      console.log(`✅ 旧格式 - 消息发送到 ${target} 成功:`, response);
      return response;
    } catch (error) {
      console.error(`❌ 旧格式 - 消息发送到 ${target} 失败:`, error);
      throw error;
    }
  }
}

// ============================================================================
// 4. 性能和复杂度对比
// ============================================================================

/**
 * 复杂度对比
 */
const complexityComparison = {
  old: {
    description: '旧格式需要开发者记住不同的转发 action',
    actions: [
      'forwardToContentScript',
      'forwardToPopup', 
      'forwardToSidePanel',
      'broadcast'
    ],
    complexity: 'HIGH',
    errorProne: true,
    codeLines: 8, // 平均每个消息需要的代码行数
    learningCurve: 'STEEP'
  },
  
  new: {
    description: '新格式只需要一个统一的 action，系统自动路由',
    actions: [
      'message' // 或 'send'
    ],
    complexity: 'LOW',
    errorProne: false,
    codeLines: 4, // 平均每个消息需要的代码行数
    learningCurve: 'GENTLE'
  }
};

/**
 * 代码量对比示例
 */
const codeComparison = {
  // 发送5个不同类型的消息
  oldFormat: `
    // 需要记住5个不同的 action
    await sendMessage('forwardToContentScript', { action: 'applyTheme', theme: 'dark' });
    await sendMessage('forwardToPopup', { action: 'updateStatus', status: 'ready' });
    await sendMessage('forwardToSidePanel', { action: 'updateSidebar', data: {} });
    await sendMessage('broadcast', { action: 'globalUpdate', version: '1.0' });
    await sendMessage('forwardToContentScript', { action: 'analyzePage' });
    
    // 总计：5个不同的转发 action + 5个实际 action = 10个 action
  `,
  
  newFormat: `
    // 只需要记住1个统一的 action
    await sendMessage({ action: 'applyTheme', theme: 'dark' });           // 自动路由到 content
    await sendMessage({ action: 'updateStatus', status: 'ready' });       // 自动路由到 popup
    await sendMessage({ action: 'updateSidebar', data: {} }, 'sidepanel'); // 明确指定目标
    await sendMessage({ action: 'globalUpdate', version: '1.0' }, 'broadcast'); // 明确指定广播
    await sendMessage({ action: 'analyzePage' });                         // 自动路由到 content
    
    // 总计：1个统一的转发 action + 5个实际 action = 6个 action
  `
};

// ============================================================================
// 5. 迁移指南
// ============================================================================

/**
 * 从旧格式迁移到新格式的步骤
 */
const migrationGuide = {
  step1: {
    title: '识别现有的消息发送代码',
    description: '找到所有使用 forwardToXXX action 的代码',
    example: `
      // 查找这些模式：
      chrome.runtime.sendMessage({ action: 'forwardToContentScript', ... })
      chrome.runtime.sendMessage({ action: 'forwardToPopup', ... })
      chrome.runtime.sendMessage({ action: 'forwardToSidePanel', ... })
    `
  },
  
  step2: {
    title: '替换为新格式',
    description: '将转发 action 替换为统一的 message action',
    before: `
      chrome.runtime.sendMessage({
        action: 'forwardToContentScript',
        data: { action: 'applyTheme', theme: 'dark' }
      })
    `,
    after: `
      chrome.runtime.sendMessage({
        action: 'message',
        data: { action: 'applyTheme', theme: 'dark' }
      })
    `
  },
  
  step3: {
    title: '测试自动路由',
    description: '验证消息是否正确路由到目标组件',
    tips: [
      '检查控制台日志中的路由信息',
      '确认消息能够正确到达目标组件',
      '验证响应数据的正确性'
    ]
  },
  
  step4: {
    title: '优化特殊场景',
    description: '对于需要明确指定目标的场景，添加 target 参数',
    example: `
      // 需要发送到特定目标时
      chrome.runtime.sendMessage({
        action: 'message',
        target: 'sidepanel',  // 明确指定目标
        data: { action: 'updateSidebar', data: {} }
      })
    `
  }
};

// ============================================================================
// 6. 导出和使用
// ============================================================================

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    oldMessageFormat,
    newMessageFormat,
    sendMessage,
    sendMessageOldFormat,
    ThemeManager,
    PageAnalyzer,
    MultiTargetMessenger,
    complexityComparison,
    codeComparison,
    migrationGuide
  };
}

// 在浏览器环境中暴露到全局
if (typeof window !== 'undefined') {
  window.MessageFormatComparison = {
    oldMessageFormat,
    newMessageFormat,
    sendMessage,
    sendMessageOldFormat,
    ThemeManager,
    PageAnalyzer,
    MultiTargetMessenger,
    complexityComparison,
    codeComparison,
    migrationGuide
  };
}

// 使用示例
console.log('📋 消息格式对比示例已加载');
console.log('🆕 新格式特点:', complexityComparison.new);
console.log('🔄 旧格式特点:', complexityComparison.old);
console.log('📖 迁移指南:', migrationGuide);