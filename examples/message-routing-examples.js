/**
 * Chrome 扩展消息路由系统使用示例
 * 展示如何在不同组件中使用统一的消息转发功能
 */

// ============================================================================
// 1. Popup 页面示例
// ============================================================================

/**
 * Popup 页面消息处理示例
 * 文件: src/popup/popup.js
 */
class PopupMessageHandler {
  constructor() {
    this.initializeMessageHandling();
  }

  /**
   * 初始化消息处理
   */
  initializeMessageHandling() {
    // 页面加载时获取待处理消息
    window.addEventListener('load', () => {
      this.getQueuedMessages();
    });
  }

  /**
   * 获取队列中的待处理消息
   */
  async getQueuedMessages() {
    try {
      const response = await this.sendMessage({
        action: 'system',
        type: 'getMessageQueue',
        data: { target: 'popup' }
      });

      if (response.success) {
        const messages = response.data.messages;
        console.log(`📬 收到 ${messages.length} 条待处理消息`);
        
        // 处理每条消息
        messages.forEach(message => {
          this.handleIncomingMessage(message);
        });
      }
    } catch (error) {
      console.error('获取消息队列失败:', error);
    }
  }

  /**
   * 处理收到的消息
   * @param {Object} message - 消息对象
   */
  handleIncomingMessage(message) {
    console.log('📨 处理消息:', message);
    
    switch (message.action) {
      case 'updateStatus':
        this.updateUIStatus(message.payload);
        break;
        
      case 'themeChanged':
        this.handleThemeChange(message.payload);
        break;
        
      case 'pageAnalyzed':
        this.displayAnalysisResults(message.payload);
        break;
        
      default:
        console.log('未知消息类型:', message.action);
    }
  }

  /**
   * 发送消息到 Content Script
   * @param {Object} data - 要发送的数据
   */
  async sendToContentScript(data) {
    try {
      const response = await this.sendMessage({
        action: 'forwardToContentScript',
        data: data
      });

      if (response.success) {
        console.log('✅ 消息已发送到 Content Script');
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('❌ 发送到 Content Script 失败:', error);
      this.showError('无法与页面通信，请刷新页面后重试');
    }
  }

  /**
   * 应用主题
   * @param {string} theme - 主题名称
   */
  async applyTheme(theme) {
    const themeData = {
      action: 'pageBeautify.applyTheme',
      theme: theme,
      timestamp: Date.now()
    };

    const result = await this.sendToContentScript(themeData);
    
    if (result) {
      // 更新UI状态
      this.updateThemeButton(theme);
      
      // 保存用户偏好
      await this.saveUserPreference('selectedTheme', theme);
    }
  }

  /**
   * 保存用户偏好设置
   * @param {string} key - 设置键
   * @param {any} value - 设置值
   */
  async saveUserPreference(key, value) {
    try {
      const response = await this.sendMessage({
        action: 'storage',
        type: 'set',
        data: {
          items: { [key]: value }
        }
      });

      if (response.success) {
        console.log(`✅ 偏好设置已保存: ${key} = ${value}`);
      }
    } catch (error) {
      console.error('保存偏好设置失败:', error);
    }
  }

  /**
   * 发送消息的通用方法
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>} 响应对象
   */
  sendMessage(message) {
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

  // UI 更新方法示例
  updateUIStatus(status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = status.message;
      statusElement.className = `status ${status.type}`;
    }
  }

  updateThemeButton(theme) {
    const buttons = document.querySelectorAll('.theme-button');
    buttons.forEach(button => {
      button.classList.toggle('active', button.dataset.theme === theme);
    });
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }
}

// ============================================================================
// 2. Content Script 示例
// ============================================================================

/**
 * Content Script 消息处理示例
 * 文件: src/content-scripts/content-script.js
 */
class ContentScriptMessageHandler {
  constructor() {
    this.initializeMessageHandling();
    this.pageAnalyzer = new PageAnalyzer();
  }

  /**
   * 初始化消息处理
   */
  initializeMessageHandling() {
    // 监听来自 Background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 异步响应
    });

    // 页面加载完成后发送状态更新
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.notifyPageReady();
      });
    } else {
      this.notifyPageReady();
    }
  }

  /**
   * 处理收到的消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} sendResponse - 响应函数
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📨 Content Script 收到消息:', message);

      let result;

      switch (message.action) {
        case 'pageBeautify.applyTheme':
          result = await this.applyTheme(message.theme);
          break;

        case 'pageBeautify.clearStyles':
          result = await this.clearStyles();
          break;

        case 'page.analyze':
          result = await this.analyzePage();
          break;

        case 'page.highlight':
          result = await this.highlightElements(message.selector);
          break;

        case 'system.ping':
          result = { pong: true, timestamp: Date.now() };
          break;

        default:
          result = { error: `未知的消息类型: ${message.action}` };
      }

      sendResponse({
        success: true,
        data: result,
        messageId: message.messageId
      });

    } catch (error) {
      console.error('❌ Content Script 消息处理失败:', error);
      sendResponse({
        success: false,
        error: error.message,
        messageId: message.messageId
      });
    }
  }

  /**
   * 通知页面已准备就绪
   */
  async notifyPageReady() {
    try {
      await this.sendToBackground({
        action: 'forwardToPopup',
        data: {
          action: 'pageReady',
          payload: {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
          }
        }
      });
    } catch (error) {
      console.error('通知页面就绪失败:', error);
    }
  }

  /**
   * 应用主题
   * @param {string} theme - 主题名称
   */
  async applyTheme(theme) {
    const themeStyles = this.getThemeStyles(theme);
    
    // 移除旧的主题样式
    const oldStyle = document.getElementById('extension-theme-style');
    if (oldStyle) {
      oldStyle.remove();
    }

    // 应用新的主题样式
    const styleElement = document.createElement('style');
    styleElement.id = 'extension-theme-style';
    styleElement.textContent = themeStyles;
    document.head.appendChild(styleElement);

    // 通知应用成功
    await this.sendToBackground({
      action: 'forwardToPopup',
      data: {
        action: 'themeApplied',
        payload: {
          theme: theme,
          timestamp: Date.now()
        }
      }
    });

    return { theme: theme, applied: true };
  }

  /**
   * 分析页面
   */
  async analyzePage() {
    const analysis = {
      url: window.location.href,
      title: document.title,
      elementCount: document.querySelectorAll('*').length,
      images: document.querySelectorAll('img').length,
      links: document.querySelectorAll('a').length,
      forms: document.querySelectorAll('form').length,
      timestamp: Date.now()
    };

    // 发送分析结果到 Popup
    await this.sendToBackground({
      action: 'forwardToPopup',
      data: {
        action: 'pageAnalyzed',
        payload: analysis
      }
    });

    return analysis;
  }

  /**
   * 发送消息到 Background
   * @param {Object} message - 消息对象
   */
  sendToBackground(message) {
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
   * 获取主题样式
   * @param {string} theme - 主题名称
   */
  getThemeStyles(theme) {
    const themes = {
      dark: `
        body { 
          background-color: #1a1a1a !important; 
          color: #e0e0e0 !important; 
        }
        a { color: #4a9eff !important; }
        input, textarea { 
          background-color: #2a2a2a !important; 
          color: #e0e0e0 !important; 
          border: 1px solid #444 !important; 
        }
      `,
      light: `
        body { 
          background-color: #ffffff !important; 
          color: #333333 !important; 
        }
        a { color: #0066cc !important; }
      `,
      sepia: `
        body { 
          background-color: #f4f1ea !important; 
          color: #5c4b37 !important; 
        }
        a { color: #8b4513 !important; }
      `
    };

    return themes[theme] || themes.light;
  }
}

// ============================================================================
// 3. Sidebar 页面示例
// ============================================================================

/**
 * Sidebar 页面消息处理示例
 * 文件: src/sidebar/sidebar.js
 */
class SidebarMessageHandler {
  constructor() {
    this.initializeMessageHandling();
  }

  /**
   * 初始化消息处理
   */
  initializeMessageHandling() {
    // 页面加载时获取待处理消息
    window.addEventListener('load', () => {
      this.getQueuedMessages();
    });

    // 定期检查新消息
    setInterval(() => {
      this.getQueuedMessages();
    }, 5000);
  }

  /**
   * 获取队列中的待处理消息
   */
  async getQueuedMessages() {
    try {
      const response = await this.sendMessage({
        action: 'system',
        type: 'getMessageQueue',
        data: { target: 'sidepanel' }
      });

      if (response.success && response.data.messages.length > 0) {
        const messages = response.data.messages;
        console.log(`📬 Sidebar 收到 ${messages.length} 条新消息`);
        
        messages.forEach(message => {
          this.handleIncomingMessage(message);
        });
      }
    } catch (error) {
      console.error('获取 Sidebar 消息队列失败:', error);
    }
  }

  /**
   * 处理收到的消息
   * @param {Object} message - 消息对象
   */
  handleIncomingMessage(message) {
    switch (message.action) {
      case 'updateSidebar':
        this.updateSidebarContent(message.payload);
        break;
        
      case 'pageAnalyzed':
        this.displayPageAnalysis(message.payload);
        break;
        
      case 'themeChanged':
        this.updateThemeIndicator(message.payload);
        break;
        
      default:
        console.log('Sidebar 收到未知消息:', message.action);
    }
  }

  /**
   * 发送消息的通用方法
   * @param {Object} message - 消息对象
   */
  sendMessage(message) {
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

  // UI 更新方法示例
  updateSidebarContent(data) {
    const contentElement = document.getElementById('sidebar-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="update-item">
          <h3>${data.title || '更新'}</h3>
          <p>${data.message || ''}</p>
          <small>${new Date(data.timestamp).toLocaleString()}</small>
        </div>
      `;
    }
  }

  displayPageAnalysis(analysis) {
    const analysisElement = document.getElementById('page-analysis');
    if (analysisElement) {
      analysisElement.innerHTML = `
        <div class="analysis-result">
          <h3>页面分析结果</h3>
          <p><strong>标题:</strong> ${analysis.title}</p>
          <p><strong>URL:</strong> ${analysis.url}</p>
          <p><strong>元素数量:</strong> ${analysis.elementCount}</p>
          <p><strong>图片数量:</strong> ${analysis.images}</p>
          <p><strong>链接数量:</strong> ${analysis.links}</p>
          <p><strong>表单数量:</strong> ${analysis.forms}</p>
        </div>
      `;
    }
  }
}

// ============================================================================
// 4. 通用工具函数
// ============================================================================

/**
 * 消息发送工具类
 */
class MessageUtils {
  /**
   * 发送消息并处理错误
   * @param {Object} message - 消息对象
   * @param {Object} options - 选项
   */
  static async sendMessageSafely(message, options = {}) {
    const { timeout = 5000, retries = 3 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          this.sendMessage(message),
          this.createTimeoutPromise(timeout)
        ]);
        
        return response;
      } catch (error) {
        console.warn(`消息发送失败 (尝试 ${attempt}/${retries}):`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // 等待后重试
        await this.delay(1000 * attempt);
      }
    }
  }

  /**
   * 发送消息
   * @param {Object} message - 消息对象
   */
  static sendMessage(message) {
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
   * 创建超时 Promise
   * @param {number} timeout - 超时时间（毫秒）
   */
  static createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`消息发送超时 (${timeout}ms)`));
      }, timeout);
    });
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间（毫秒）
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 批量发送消息
   * @param {Array} messages - 消息数组
   * @param {Object} options - 选项
   */
  static async sendMessagesBatch(messages, options = {}) {
    const { concurrent = 5 } = options;
    const results = [];
    
    for (let i = 0; i < messages.length; i += concurrent) {
      const batch = messages.slice(i, i + concurrent);
      const batchPromises = batch.map(message => 
        this.sendMessageSafely(message).catch(error => ({ error: error.message }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
}

// ============================================================================
// 5. 使用示例
// ============================================================================

// 在 Popup 中使用
if (typeof window !== 'undefined' && window.location.pathname.includes('popup')) {
  const popupHandler = new PopupMessageHandler();
  
  // 绑定按钮事件
  document.addEventListener('DOMContentLoaded', () => {
    // 主题切换按钮
    document.querySelectorAll('.theme-button').forEach(button => {
      button.addEventListener('click', () => {
        const theme = button.dataset.theme;
        popupHandler.applyTheme(theme);
      });
    });
    
    // 分析页面按钮
    const analyzeButton = document.getElementById('analyze-page');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', async () => {
        try {
          await popupHandler.sendToContentScript({
            action: 'page.analyze'
          });
        } catch (error) {
          console.error('分析页面失败:', error);
        }
      });
    }
  });
}

// 在 Content Script 中使用
if (typeof window !== 'undefined' && !window.location.pathname.includes('popup')) {
  const contentHandler = new ContentScriptMessageHandler();
  
  // 暴露到全局作用域供调试使用
  window.contentScriptHandler = contentHandler;
}

// 在 Sidebar 中使用
if (typeof window !== 'undefined' && window.location.pathname.includes('sidebar')) {
  const sidebarHandler = new SidebarMessageHandler();
  
  // 暴露到全局作用域供调试使用
  window.sidebarHandler = sidebarHandler;
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PopupMessageHandler,
    ContentScriptMessageHandler,
    SidebarMessageHandler,
    MessageUtils
  };
}