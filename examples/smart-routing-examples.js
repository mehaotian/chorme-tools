/**
 * Chrome 扩展智能消息路由系统使用示例
 * 展示如何使用简化的消息格式进行组件间通信
 */

// ============================================================================
// 1. 新的简化消息格式 - 只需要一个 action
// ============================================================================

/**
 * 统一的消息发送函数
 * @param {Object} data - 消息数据
 * @param {string} target - 可选的目标类型，不指定则自动路由
 * @returns {Promise<Object>} 响应结果
 */
function sendMessage(data, target = null) {
  const message = {
    action: 'message', // 统一使用 'message' 作为 action
    data: data,
    target: target, // 可选：明确指定目标
    messageId: generateMessageId(),
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
 * 生成消息ID
 * @returns {string} 消息ID
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// 2. Popup 页面使用示例
// ============================================================================

/**
 * Popup 页面智能消息处理
 */
class PopupSmartMessaging {
  constructor() {
    this.initializeMessaging();
  }

  /**
   * 初始化消息处理
   */
  initializeMessaging() {
    // 页面加载时获取待处理消息
    window.addEventListener('load', () => {
      this.getQueuedMessages();
    });
  }

  /**
   * 应用主题 - 自动发送到 Content Script
   * @param {string} theme - 主题名称
   */
  async applyTheme(theme) {
    try {
      // 不需要指定 forwardToContentScript，系统会自动识别
      const response = await sendMessage({
        action: 'pageBeautify.applyTheme',
        theme: theme,
        options: {
          animation: true,
          duration: 300
        }
      });

      console.log('✅ 主题应用成功:', response);
      this.updateThemeButton(theme);
      
    } catch (error) {
      console.error('❌ 主题应用失败:', error);
      this.showError('主题应用失败，请重试');
    }
  }

  /**
   * 分析当前页面 - 自动发送到 Content Script
   */
  async analyzePage() {
    try {
      const response = await sendMessage({
        action: 'page.analyze',
        options: {
          includeImages: true,
          includeLinks: true,
          includeForms: true
        }
      });

      console.log('📊 页面分析完成:', response.data);
      this.displayAnalysisResults(response.data);
      
    } catch (error) {
      console.error('❌ 页面分析失败:', error);
    }
  }

  /**
   * 发送消息到侧栏 - 明确指定目标
   */
  async updateSidebar(data) {
    try {
      const response = await sendMessage({
        action: 'updateSidebar',
        payload: data
      }, 'sidepanel'); // 明确指定发送到侧栏

      console.log('📤 侧栏更新成功:', response);
      
    } catch (error) {
      console.error('❌ 侧栏更新失败:', error);
    }
  }

  /**
   * 广播消息到所有组件
   */
  async broadcastUpdate(updateData) {
    try {
      const response = await sendMessage({
        action: 'globalUpdate',
        payload: updateData
      }, 'broadcast'); // 明确指定广播

      console.log('📡 广播消息发送成功:', response);
      
    } catch (error) {
      console.error('❌ 广播消息失败:', error);
    }
  }

  /**
   * 获取队列中的待处理消息
   */
  async getQueuedMessages() {
    try {
      const response = await sendMessage({
        action: 'system.getMessageQueue',
        target: 'popup'
      });

      if (response.success && response.data.messages.length > 0) {
        console.log(`📬 收到 ${response.data.messages.length} 条待处理消息`);
        response.data.messages.forEach(msg => this.handleIncomingMessage(msg));
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
      case 'themeApplied':
        this.onThemeApplied(message.payload);
        break;
        
      case 'pageAnalyzed':
        this.displayAnalysisResults(message.payload);
        break;
        
      case 'statusUpdate':
        this.updateStatus(message.payload);
        break;
        
      default:
        console.log('未知消息类型:', message.action);
    }
  }

  // UI 更新方法
  updateThemeButton(theme) {
    document.querySelectorAll('.theme-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  displayAnalysisResults(analysis) {
    const resultElement = document.getElementById('analysis-result');
    if (resultElement) {
      resultElement.innerHTML = `
        <h3>页面分析结果</h3>
        <p>标题: ${analysis.title}</p>
        <p>元素数量: ${analysis.elementCount}</p>
        <p>图片数量: ${analysis.images}</p>
        <p>链接数量: ${analysis.links}</p>
      `;
    }
  }

  updateStatus(status) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = status.message;
      statusElement.className = `status ${status.type}`;
    }
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => errorElement.style.display = 'none', 5000);
    }
  }

  onThemeApplied(data) {
    console.log('🎨 主题已应用:', data.theme);
    this.updateThemeButton(data.theme);
  }
}

// ============================================================================
// 3. Content Script 使用示例
// ============================================================================

/**
 * Content Script 智能消息处理
 */
class ContentScriptSmartMessaging {
  constructor() {
    this.initializeMessaging();
  }

  /**
   * 初始化消息处理
   */
  initializeMessaging() {
    // 监听来自 Background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 异步响应
    });

    // 页面加载完成后通知 Popup
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
          result = await this.applyTheme(message.theme, message.options);
          break;

        case 'page.analyze':
          result = await this.analyzePage(message.options);
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
   * 通知页面已准备就绪 - 自动发送到 Popup
   */
  async notifyPageReady() {
    try {
      await sendMessage({
        action: 'pageReady',
        payload: {
          url: window.location.href,
          title: document.title,
          timestamp: Date.now()
        }
      }); // 不指定目标，自动发送到 Popup

      console.log('✅ 页面就绪通知已发送');
    } catch (error) {
      console.error('❌ 页面就绪通知失败:', error);
    }
  }

  /**
   * 应用主题
   * @param {string} theme - 主题名称
   * @param {Object} options - 选项
   */
  async applyTheme(theme, options = {}) {
    const themeStyles = this.getThemeStyles(theme);
    
    // 移除旧样式
    const oldStyle = document.getElementById('extension-theme-style');
    if (oldStyle) oldStyle.remove();

    // 应用新样式
    const styleElement = document.createElement('style');
    styleElement.id = 'extension-theme-style';
    styleElement.textContent = themeStyles;
    document.head.appendChild(styleElement);

    // 通知应用成功 - 自动发送到 Popup
    await sendMessage({
      action: 'themeApplied',
      payload: {
        theme: theme,
        timestamp: Date.now()
      }
    });

    return { theme: theme, applied: true };
  }

  /**
   * 分析页面
   * @param {Object} options - 分析选项
   */
  async analyzePage(options = {}) {
    const analysis = {
      url: window.location.href,
      title: document.title,
      elementCount: document.querySelectorAll('*').length,
      timestamp: Date.now()
    };

    if (options.includeImages) {
      analysis.images = document.querySelectorAll('img').length;
    }

    if (options.includeLinks) {
      analysis.links = document.querySelectorAll('a').length;
    }

    if (options.includeForms) {
      analysis.forms = document.querySelectorAll('form').length;
    }

    // 发送分析结果到 Popup - 自动路由
    await sendMessage({
      action: 'pageAnalyzed',
      payload: analysis
    });

    return analysis;
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
      `,
      light: `
        body { 
          background-color: #ffffff !important; 
          color: #333333 !important; 
        }
        a { color: #0066cc !important; }
      `
    };

    return themes[theme] || themes.light;
  }
}

// ============================================================================
// 4. Sidebar 使用示例
// ============================================================================

/**
 * Sidebar 智能消息处理
 */
class SidebarSmartMessaging {
  constructor() {
    this.initializeMessaging();
  }

  /**
   * 初始化消息处理
   */
  initializeMessaging() {
    window.addEventListener('load', () => {
      this.getQueuedMessages();
    });

    // 定期检查新消息
    setInterval(() => {
      this.getQueuedMessages();
    }, 5000);
  }

  /**
   * 发送指令到页面 - 自动发送到 Content Script
   */
  async sendPageCommand(command, params = {}) {
    try {
      const response = await sendMessage({
        action: `page.${command}`,
        params: params
      }); // 不指定目标，自动发送到 Content Script

      console.log(`✅ 页面指令 ${command} 执行成功:`, response);
      return response;
    } catch (error) {
      console.error(`❌ 页面指令 ${command} 执行失败:`, error);
      throw error;
    }
  }

  /**
   * 更新 Popup 状态 - 明确指定目标
   */
  async updatePopupStatus(status) {
    try {
      await sendMessage({
        action: 'statusUpdate',
        payload: status
      }, 'popup'); // 明确指定发送到 Popup

      console.log('✅ Popup 状态更新成功');
    } catch (error) {
      console.error('❌ Popup 状态更新失败:', error);
    }
  }

  /**
   * 获取队列中的待处理消息
   */
  async getQueuedMessages() {
    try {
      const response = await sendMessage({
        action: 'system.getMessageQueue',
        target: 'sidepanel'
      });

      if (response.success && response.data.messages.length > 0) {
        console.log(`📬 Sidebar 收到 ${response.data.messages.length} 条新消息`);
        response.data.messages.forEach(msg => this.handleIncomingMessage(msg));
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
        this.updateContent(message.payload);
        break;
        
      case 'pageAnalyzed':
        this.displayPageAnalysis(message.payload);
        break;
        
      default:
        console.log('Sidebar 收到未知消息:', message.action);
    }
  }

  updateContent(data) {
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
        </div>
      `;
    }
  }
}

// ============================================================================
// 5. 使用对比：旧 vs 新
// ============================================================================

/**
 * 旧的复杂消息格式（需要两个 action）
 */
const oldWay = {
  // Popup 发送到 Content Script
  popupToContent: {
    action: 'forwardToContentScript', // 第一个 action：指定转发目标
    data: {
      action: 'pageBeautify.applyTheme', // 第二个 action：实际操作
      theme: 'dark'
    }
  },
  
  // Content Script 发送到 Popup
  contentToPopup: {
    action: 'forwardToPopup', // 第一个 action：指定转发目标
    data: {
      action: 'themeApplied', // 第二个 action：实际操作
      payload: { theme: 'dark' }
    }
  }
};

/**
 * 新的简化消息格式（只需要一个 action）
 */
const newWay = {
  // Popup 发送到 Content Script（自动识别）
  popupToContent: {
    action: 'message', // 统一的 action
    data: {
      action: 'pageBeautify.applyTheme', // 实际操作
      theme: 'dark'
    }
    // 系统自动识别发送者是 Popup，自动路由到 Content Script
  },
  
  // Content Script 发送到 Popup（自动识别）
  contentToPopup: {
    action: 'message', // 统一的 action
    data: {
      action: 'themeApplied', // 实际操作
      payload: { theme: 'dark' }
    }
    // 系统自动识别发送者是 Content Script，自动路由到 Popup
  },
  
  // 明确指定目标（可选）
  explicitTarget: {
    action: 'message',
    target: 'sidepanel', // 明确指定目标
    data: {
      action: 'updateSidebar',
      payload: { message: 'Hello Sidebar' }
    }
  }
};

// ============================================================================
// 6. 实际使用示例
// ============================================================================

// 在各个组件中初始化
if (typeof window !== 'undefined') {
  // Popup 页面
  if (window.location.pathname.includes('popup')) {
    const popupMessaging = new PopupSmartMessaging();
    window.popupMessaging = popupMessaging;
    
    // 绑定事件
    document.addEventListener('DOMContentLoaded', () => {
      // 主题按钮
      document.querySelectorAll('.theme-button').forEach(button => {
        button.addEventListener('click', () => {
          popupMessaging.applyTheme(button.dataset.theme);
        });
      });
      
      // 分析按钮
      const analyzeBtn = document.getElementById('analyze-page');
      if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
          popupMessaging.analyzePage();
        });
      }
    });
  }
  
  // Content Script
  else if (!window.location.pathname.includes('popup') && !window.location.pathname.includes('sidebar')) {
    const contentMessaging = new ContentScriptSmartMessaging();
    window.contentMessaging = contentMessaging;
  }
  
  // Sidebar 页面
  else if (window.location.pathname.includes('sidebar')) {
    const sidebarMessaging = new SidebarSmartMessaging();
    window.sidebarMessaging = sidebarMessaging;
  }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PopupSmartMessaging,
    ContentScriptSmartMessaging,
    SidebarSmartMessaging,
    sendMessage,
    generateMessageId
  };
}