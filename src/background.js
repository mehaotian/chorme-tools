/**
 * Chrome 扩展 Background Script
 * 负责处理所有组件间的消息转发和路由
 * 支持 popup、content-scripts、侧栏等组件的统一通信
 */

/**
 * 消息路由管理器
 * 统一处理所有消息的转发和路由
 */
class MessageRouter {
  constructor() {
    this.messageHandlers = new Map();
    this.activeConnections = new Map();
    this.messageQueue = new Map();
    this.retryCount = 3;
    this.retryDelay = 1000;
    
    this.initializeRouter();
  }

  /**
   * 初始化消息路由器
   */
  initializeRouter() {
    // 监听消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // 监听连接
    chrome.runtime.onConnect.addListener(this.handleConnection.bind(this));
    
    // 监听标签页更新
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // 监听标签页移除
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    
    console.log('📡 消息路由器已初始化');
  }

  /**
   * 处理消息的主要入口
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} sendResponse - 响应函数
   * @returns {boolean} 是否异步响应
   */
  handleMessage(message, sender, sendResponse) {
    try {
      // 验证消息格式
      const validation = this.validateMessage(message, sender);
      if (!validation.isValid) {
        console.warn('❌ 消息格式验证失败:', validation.error, message);
        sendResponse({ 
          success: false, 
          error: validation.error,
          code: 'INVALID_MESSAGE_FORMAT'
        });
        return false;
      }

      // 记录消息日志
      this.logMessage(message, sender, 'received');

      // 处理消息路由
      this.routeMessage(message, sender, sendResponse);
      
      // 返回true表示异步响应
      return true;
      
    } catch (error) {
      console.error('❌ 消息处理异常:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        code: 'MESSAGE_PROCESSING_ERROR'
      });
      return false;
    }
  }

  /**
   * 验证消息格式
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Object} 验证结果
   */
  validateMessage(message, sender) {
    // 基础格式验证
    if (!message || typeof message !== 'object') {
      return { isValid: false, error: '消息必须是对象类型' };
    }

    if (!message.action || typeof message.action !== 'string') {
      return { isValid: false, error: '消息必须包含有效的action字段' };
    }

    // 发送者验证
    if (!sender) {
      return { isValid: false, error: '缺少发送者信息' };
    }

    // 消息ID验证（用于追踪）
    if (!message.messageId) {
      message.messageId = this.generateMessageId();
    }

    return { isValid: true };
  }

  /**
   * 路由消息到目标
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} sendResponse - 响应函数
   */
  async routeMessage(message, sender, sendResponse) {
    const { action, target, data } = message;
    
    try {
      let result;
      
      // 自动识别发送者类型并智能路由
      if (action === 'message' || action === 'send') {
        result = await this.smartRoute(message, sender);
      } else {
        // 保持向后兼容，支持原有的具体action
        switch (action) {
          // 转发到content script
          case 'forwardToContentScript':
          case 'toContentScript':
          case 'toContent':
            result = await this.forwardToContentScript(message, sender);
            break;
            
          // 转发到popup
          case 'forwardToPopup':
          case 'toPopup':
            result = await this.forwardToPopup(message, sender);
            break;
            
          // 转发到侧栏
          case 'forwardToSidePanel':
          case 'toSidePanel':
          case 'toSidebar':
            result = await this.forwardToSidePanel(message, sender);
            break;
            
          // 广播消息
          case 'broadcast':
          case 'broadcastMessage':
            result = await this.broadcastMessage(message, sender);
            break;
            
          // 页面美化相关消息
          case 'pageBeautify':
            result = await this.handlePageBeautifyMessage(message, sender);
            break;
            
          // 存储相关消息
          case 'storage':
            result = await this.handleStorageMessage(message, sender);
            break;
            
          // 标签页相关消息
          case 'tabs':
            result = await this.handleTabsMessage(message, sender);
            break;
            
          // 系统消息
          case 'system':
            result = await this.handleSystemMessage(message, sender);
            break;
            
          default:
            // 未知消息类型，尝试智能路由
            result = await this.smartRoute(message, sender);
        }
      }
      
      // 记录响应日志
      this.logMessage(result, sender, 'response');
      
      sendResponse(result);
      
    } catch (error) {
      console.error(`❌ 路由消息失败 [${action}]:`, error);
      const errorResponse = {
        success: false,
        error: error.message,
        code: 'ROUTING_ERROR',
        messageId: message.messageId
      };
      
      this.logMessage(errorResponse, sender, 'error');
      sendResponse(errorResponse);
    }
  }

  /**
   * 智能路由 - 自动识别发送者并路由到合适的目标
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 路由结果
   */
  async smartRoute(message, sender) {
    const senderType = this.identifySender(sender);
    const { target, data } = message;
    
    console.log(`🎯 智能路由: ${senderType} -> ${target || 'auto'}`);
    
    // 如果明确指定了目标，直接路由
    if (target) {
      return await this.routeToTarget(target, message, sender);
    }
    
    // 根据发送者类型自动选择目标
    switch (senderType) {
      case 'popup':
        // Popup 默认发送到当前活跃标签页的 content script
        return await this.routeToTarget('content', message, sender);
        
      case 'content':
        // Content script 默认发送到 popup
        return await this.routeToTarget('popup', message, sender);
        
      case 'sidepanel':
        // Sidepanel 默认发送到当前活跃标签页的 content script
        return await this.routeToTarget('content', message, sender);
        
      case 'background':
        // Background 根据消息内容智能选择
        return await this.autoSelectTarget(message, sender);
        
      default:
        // 未知发送者，尝试广播
        console.warn(`⚠️ 未知发送者类型: ${senderType}，执行广播`);
        return await this.broadcastMessage(message, sender);
    }
  }

  /**
   * 识别发送者类型
   * @param {Object} sender - 发送者信息
   * @returns {string} 发送者类型
   */
  identifySender(sender) {
    if (!sender) {
      return 'unknown';
    }
    
    // 检查是否来自 content script
    if (sender.tab && sender.frameId !== undefined) {
      return 'content';
    }
    
    // 检查是否来自 popup
    if (sender.url && sender.url.includes('popup.html')) {
      return 'popup';
    }
    
    // 检查是否来自 sidepanel
    if (sender.url && (sender.url.includes('sidepanel.html') || sender.url.includes('sidebar.html'))) {
      return 'sidepanel';
    }
    
    // 检查是否来自 background
    if (!sender.tab && !sender.url) {
      return 'background';
    }
    
    return 'unknown';
  }

  /**
   * 路由到指定目标
   * @param {string} target - 目标类型
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 路由结果
   */
  async routeToTarget(target, message, sender) {
    const normalizedTarget = target.toLowerCase();
    
    switch (normalizedTarget) {
      case 'content':
      case 'contentscript':
      case 'content-script':
        return await this.forwardToContentScript(message, sender);
        
      case 'popup':
        return await this.forwardToPopup(message, sender);
        
      case 'sidepanel':
      case 'sidebar':
      case 'side-panel':
        return await this.forwardToSidePanel(message, sender);
        
      case 'broadcast':
      case 'all':
        return await this.broadcastMessage(message, sender);
        
      default:
        throw new Error(`未知的目标类型: ${target}`);
    }
  }

  /**
   * 自动选择目标（用于复杂场景）
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 路由结果
   */
  async autoSelectTarget(message, sender) {
    const { data } = message;
    
    // 根据消息内容判断目标
    if (data && data.action) {
      const action = data.action.toLowerCase();
      
      // 页面相关操作发送到 content script
      if (action.includes('page') || action.includes('dom') || action.includes('element')) {
        return await this.routeToTarget('content', message, sender);
      }
      
      // UI 相关操作发送到 popup
      if (action.includes('ui') || action.includes('popup') || action.includes('interface')) {
        return await this.routeToTarget('popup', message, sender);
      }
      
      // 侧栏相关操作发送到 sidepanel
      if (action.includes('sidebar') || action.includes('panel')) {
        return await this.routeToTarget('sidepanel', message, sender);
      }
    }
    
    // 默认广播
    return await this.broadcastMessage(message, sender);
  }

  /**
   * 转发消息到content script
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToContentScript(message, sender) {
    const { target, data, tabId } = message;
    
    // 确定目标标签页
    const targetTabId = tabId || sender.tab?.id;
    
    if (!targetTabId) {
      throw new Error('无法确定目标标签页ID');
    }

    try {
      // 构造转发消息
      const forwardMessage = {
        ...data,
        originalSender: this.getSenderInfo(sender),
        messageId: message.messageId,
        timestamp: Date.now()
      };

      // 发送到content script
      const response = await chrome.tabs.sendMessage(targetTabId, forwardMessage);
      
      return {
        success: true,
        data: response,
        target: 'content-script',
        tabId: targetTabId,
        messageId: message.messageId
      };
      
    } catch (error) {
      // 如果content script未加载，尝试注入
      if (error.message.includes('Could not establish connection')) {
        console.log(`🔄 尝试注入content script到标签页 ${targetTabId}`);
        await this.injectContentScript(targetTabId);
        
        // 重试发送消息
        const response = await chrome.tabs.sendMessage(targetTabId, {
          ...data,
          originalSender: this.getSenderInfo(sender),
          messageId: message.messageId,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          data: response,
          target: 'content-script',
          tabId: targetTabId,
          messageId: message.messageId,
          injected: true
        };
      }
      
      throw error;
    }
  }

  /**
   * 转发消息到popup
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToPopup(message, sender) {
    // popup通信通常通过runtime.sendMessage实现
    // 这里主要是存储消息供popup获取
    const { data } = message;
    
    const forwardMessage = {
      ...data,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      target: 'popup'
    };

    // 存储消息到队列中
    const queueKey = 'popup_messages';
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }
    
    this.messageQueue.get(queueKey).push(forwardMessage);
    
    // 限制队列长度
    const queue = this.messageQueue.get(queueKey);
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }

    return {
      success: true,
      target: 'popup',
      messageId: message.messageId,
      queued: true
    };
  }

  /**
   * 转发消息到侧栏
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToSidePanel(message, sender) {
    const { data } = message;
    
    const forwardMessage = {
      ...data,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      target: 'sidepanel'
    };

    // 存储消息到队列中
    const queueKey = 'sidepanel_messages';
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }
    
    this.messageQueue.get(queueKey).push(forwardMessage);
    
    // 限制队列长度
    const queue = this.messageQueue.get(queueKey);
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100);
    }

    return {
      success: true,
      target: 'sidepanel',
      messageId: message.messageId,
      queued: true
    };
  }

  /**
   * 广播消息到所有组件
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 广播结果
   */
  async broadcastMessage(message, sender) {
    const { data, excludeSender = true } = message;
    const results = [];
    
    const broadcastMessage = {
      ...data,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      broadcast: true
    };

    try {
      // 广播到所有活动标签页的content script
      const tabs = await chrome.tabs.query({ active: true });
      
      for (const tab of tabs) {
        if (excludeSender && sender.tab?.id === tab.id) {
          continue;
        }
        
        try {
          const response = await chrome.tabs.sendMessage(tab.id, broadcastMessage);
          results.push({
            target: 'content-script',
            tabId: tab.id,
            success: true,
            data: response
          });
        } catch (error) {
          results.push({
            target: 'content-script',
            tabId: tab.id,
            success: false,
            error: error.message
          });
        }
      }
      
      // 广播到popup和侧栏（通过消息队列）
      ['popup_messages', 'sidepanel_messages'].forEach(queueKey => {
        if (!this.messageQueue.has(queueKey)) {
          this.messageQueue.set(queueKey, []);
        }
        this.messageQueue.get(queueKey).push(broadcastMessage);
      });
      
      return {
        success: true,
        target: 'broadcast',
        messageId: message.messageId,
        results
      };
      
    } catch (error) {
      throw new Error(`广播消息失败: ${error.message}`);
    }
  }

  /**
   * 处理页面美化相关消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handlePageBeautifyMessage(message, sender) {
    // 页面美化消息通常需要转发到content script
    return await this.forwardToContentScript({
      ...message,
      action: 'forwardToContentScript',
      data: message
    }, sender);
  }

  /**
   * 处理存储相关消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handleStorageMessage(message, sender) {
    const { type, data } = message;
    
    try {
      let result;
      
      switch (type) {
        case 'get':
          result = await chrome.storage.local.get(data.keys);
          break;
          
        case 'set':
          await chrome.storage.local.set(data.items);
          result = { success: true };
          break;
          
        case 'remove':
          await chrome.storage.local.remove(data.keys);
          result = { success: true };
          break;
          
        case 'clear':
          await chrome.storage.local.clear();
          result = { success: true };
          break;
          
        default:
          throw new Error(`未知的存储操作类型: ${type}`);
      }
      
      return {
        success: true,
        data: result,
        messageId: message.messageId
      };
      
    } catch (error) {
      throw new Error(`存储操作失败: ${error.message}`);
    }
  }

  /**
   * 处理标签页相关消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handleTabsMessage(message, sender) {
    const { type, data } = message;
    
    try {
      let result;
      
      switch (type) {
        case 'query':
          result = await chrome.tabs.query(data.queryInfo || {});
          break;
          
        case 'get':
          result = await chrome.tabs.get(data.tabId);
          break;
          
        case 'update':
          result = await chrome.tabs.update(data.tabId, data.updateProperties);
          break;
          
        case 'reload':
          await chrome.tabs.reload(data.tabId, data.reloadProperties);
          result = { success: true };
          break;
          
        default:
          throw new Error(`未知的标签页操作类型: ${type}`);
      }
      
      return {
        success: true,
        data: result,
        messageId: message.messageId
      };
      
    } catch (error) {
      throw new Error(`标签页操作失败: ${error.message}`);
    }
  }

  /**
   * 处理系统消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handleSystemMessage(message, sender) {
    const { type, data } = message;
    
    switch (type) {
      case 'ping':
        return {
          success: true,
          data: { pong: true, timestamp: Date.now() },
          messageId: message.messageId
        };
        
      case 'getExtensionInfo':
        return {
          success: true,
          data: {
            id: chrome.runtime.id,
            version: chrome.runtime.getManifest()?.version,
            name: chrome.runtime.getManifest()?.name
          },
          messageId: message.messageId
        };
        
      case 'getMessageQueue':
        const queueKey = data.target + '_messages';
        const queue = this.messageQueue.get(queueKey) || [];
        
        // 清空队列
        this.messageQueue.set(queueKey, []);
        
        return {
          success: true,
          data: { messages: queue },
          messageId: message.messageId
        };
        
      default:
        throw new Error(`未知的系统消息类型: ${type}`);
    }
  }

  /**
   * 处理未知消息类型
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handleUnknownMessage(message, sender) {
    console.warn('⚠️ 收到未知消息类型:', message.action);
    
    // 尝试转发到content script
    if (sender.tab) {
      return await this.forwardToContentScript({
        ...message,
        action: 'forwardToContentScript',
        data: message
      }, sender);
    }
    
    return {
      success: false,
      error: `未知的消息类型: ${message.action}`,
      code: 'UNKNOWN_MESSAGE_TYPE',
      messageId: message.messageId
    };
  }

  /**
   * 处理连接
   * @param {Object} port - 连接端口
   */
  handleConnection(port) {
    console.log('🔗 新连接建立:', port.name);
    
    this.activeConnections.set(port.name, port);
    
    port.onDisconnect.addListener(() => {
      console.log('🔌 连接断开:', port.name);
      this.activeConnections.delete(port.name);
    });
    
    port.onMessage.addListener((message) => {
      console.log('📨 通过连接收到消息:', port.name, message);
      // 可以在这里处理长连接消息
    });
  }

  /**
   * 处理标签页更新
   * @param {number} tabId - 标签页ID
   * @param {Object} changeInfo - 变更信息
   * @param {Object} tab - 标签页对象
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      console.log(`📄 标签页加载完成: ${tabId} - ${tab.url}`);
      
      // 清理该标签页的消息队列
      const queueKey = `tab_${tabId}_messages`;
      if (this.messageQueue.has(queueKey)) {
        this.messageQueue.delete(queueKey);
      }
    }
  }

  /**
   * 处理标签页移除
   * @param {number} tabId - 标签页ID
   * @param {Object} removeInfo - 移除信息
   */
  handleTabRemoved(tabId, removeInfo) {
    console.log(`🗑️ 标签页已移除: ${tabId}`);
    
    // 清理相关的消息队列和连接
    const queueKey = `tab_${tabId}_messages`;
    if (this.messageQueue.has(queueKey)) {
      this.messageQueue.delete(queueKey);
    }
  }

  /**
   * 注入content script
   * @param {number} tabId - 标签页ID
   */
  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content-script.js']
      });
      console.log(`✅ Content script已注入到标签页 ${tabId}`);
    } catch (error) {
      console.error(`❌ Content script注入失败:`, error);
      throw error;
    }
  }

  /**
   * 获取发送者信息
   * @param {Object} sender - 发送者对象
   * @returns {Object} 发送者信息
   */
  getSenderInfo(sender) {
    return {
      id: sender.id,
      origin: sender.origin,
      url: sender.url,
      tab: sender.tab ? {
        id: sender.tab.id,
        url: sender.tab.url,
        title: sender.tab.title
      } : null,
      frameId: sender.frameId
    };
  }

  /**
   * 生成消息ID
   * @returns {string} 消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录消息日志
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {string} type - 日志类型
   */
  logMessage(message, sender, type) {
    const timestamp = new Date().toISOString();
    const senderInfo = sender ? this.getSenderInfo(sender) : null;
    
    console.log(`📋 [${timestamp}] ${type.toUpperCase()}:`, {
      messageId: message.messageId,
      action: message.action,
      type: message.type,
      sender: senderInfo,
      data: message.data ? Object.keys(message.data) : null
    });
  }
}

// 创建消息路由器实例
const messageRouter = new MessageRouter();

// 配置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  // 设置点击扩展图标时不自动打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  console.log('🎯 扩展已安装，消息路由器已启动');
});

/**
 * 扩展启动时的处理
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 扩展已启动，消息路由器运行中');
});

// 导出消息路由器（用于测试）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MessageRouter, messageRouter };
}
