import { MESSAGE_CONSTANTS } from './app-constants.js';

/**
 * 消息路由管理器
 * 统一处理所有消息的转发和路由
 */
export class MessageRouter {
  constructor() {
    this.messageHandlers = new Map();
    this.activeConnections = new Map();
    this.messageQueue = new Map();
    this.retryCount = 3;
    this.retryDelay = MESSAGE_CONSTANTS.RETRY_DELAY;
    this.initializeRouter();
  }

  /**
   * 初始化消息路由器
   */
  initializeRouter() {
    // 监听消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    console.log("📡 消息路由器已初始化");
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
        console.warn("❌ 消息格式验证失败:", validation.error, message);
        sendResponse({
          success: false,
          error: validation.error,
          code: "INVALID_MESSAGE_FORMAT",
        });
        return false;
      }

      // 记录消息日志
      this.logMessage(message, sender, "received");

      // 处理消息路由
      this.routeMessage(message, sender, sendResponse);

      // 返回true表示异步响应
      return true;
    } catch (error) {
      console.error("❌ 消息处理异常:", error);
      sendResponse({
        success: false,
        error: error.message,
        code: "MESSAGE_PROCESSING_ERROR",
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
    if (!message || typeof message !== "object") {
      return { isValid: false, error: "消息必须是对象类型" };
    }

    if (!message.action || typeof message.action !== "string") {
      return { isValid: false, error: "消息必须包含有效的action字段" };
    }

    // 发送者验证
    if (!sender) {
      return { isValid: false, error: "缺少发送者信息" };
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
    const { action } = message;
    try {
      let result;
      // 自动识别发送者类型并智能路由
      if (action === "message" || action === "send") {
        result = await this.smartRoute(message, sender);
      } else {
        // 保持向后兼容，支持原有的具体action
        result = await this.handleSpecificAction(message, sender);
      }

      // 记录响应日志
      this.logMessage(result, sender, "response");
      sendResponse(result);
    } catch (error) {
      console.error(`❌ 路由消息失败 [${action}]:`, error);
      const errorResponse = {
        success: false,
        error: error.message,
        code: "ROUTING_ERROR",
        messageId: message.messageId,
      };

      this.logMessage(errorResponse, sender, "error");
      sendResponse(errorResponse);
    }
  }

  /**
   * 处理具体的action类型
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 处理结果
   */
  async handleSpecificAction(message, sender) {
    const { action } = message;

    switch (action) {
      // 转发到content script
      case "forwardToContentScript":
      case "toContentScript":
      case "toContent":
        return await this.forwardToContentScript(message, sender);

      // 转发到popup
      case "forwardToPopup":
      case "toPopup":
        return await this.forwardToPopup(message, sender);

      // 转发到侧栏
      case "forwardToSidePanel":
      case "toSidePanel":
      case "toSidebar":
        return await this.forwardToSidePanel(message, sender);

      // 广播消息
      case "broadcast":
      case "broadcastMessage":
        return await this.broadcastMessage(message, sender);

      default:
        // 未知消息类型，尝试智能路由
        return await this.smartRoute(message, sender);
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

    console.log(`🎯 智能路由: ${senderType} -> ${target || "auto"}`);

    // 如果明确指定了目标，直接路由
    if (target) {
      return await this.routeToTarget(target, message, sender);
    }

    // 根据发送者类型自动选择目标
    switch (senderType) {
      case "popup":
        // Popup 默认发送到当前活跃标签页的 content script
        return await this.routeToTarget("content", message, sender);

      case "content":
        // Content script 默认发送到 popup
        return await this.routeToTarget("popup", message, sender);

      case "sidepanel":
        // Sidepanel 默认发送到当前活跃标签页的 content script
        return await this.routeToTarget("content", message, sender);

      case "background":
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
      return "unknown";
    }

    // 检查是否来自 content script
    if (sender.tab && sender.frameId !== undefined) {
      return "content";
    }

    // 检查是否来自 popup
    if (sender.url && sender.url.includes("popup.html")) {
      return "popup";
    }

    // 检查是否来自 sidepanel
    if (
      sender.url &&
      (sender.url.includes("sidepanel.html") ||
        sender.url.includes("sidebar.html"))
    ) {
      return "sidepanel";
    }

    // 检查是否来自 background
    if (!sender.tab && !sender.url) {
      return "background";
    }

    return "unknown";
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
      case "content":
      case "contentscript":
      case "content-script":
        return await this.forwardToContentScript(message, sender);

      case "popup":
        return await this.forwardToPopup(message, sender);

      case "sidepanel":
      case "sidebar":
      case "side-panel":
        return await this.forwardToSidePanel(message, sender);

      case "broadcast":
      case "all":
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
      if (
        action.includes("page") ||
        action.includes("dom") ||
        action.includes("element")
      ) {
        return await this.routeToTarget("content", message, sender);
      }

      // UI 相关操作发送到 popup
      if (
        action.includes("ui") ||
        action.includes("popup") ||
        action.includes("interface")
      ) {
        return await this.routeToTarget("popup", message, sender);
      }

      // 侧栏相关操作发送到 sidepanel
      if (action.includes("sidebar") || action.includes("panel")) {
        return await this.routeToTarget("sidepanel", message, sender);
      }
    }

    // 默认广播
    return await this.broadcastMessage(message, sender);
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
      tab: sender.tab
        ? {
            id: sender.tab.id,
            url: sender.tab.url,
            title: sender.tab.title,
          }
        : null,
      frameId: sender.frameId,
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
      messageId: message.messageId || "unknown",
      action: message.action || "unknown",
      type: message.type || "unknown",
      sender: senderInfo,
      data: message.data ? Object.keys(message.data) : null,
    });
  }

  // 抽象方法，需要在子类中实现
  async forwardToContentScript(message, sender) {
    throw new Error("forwardToContentScript method must be implemented");
  }

  async forwardToPopup(message, sender) {
    throw new Error("forwardToPopup method must be implemented");
  }

  async forwardToSidePanel(message, sender) {
    throw new Error("forwardToSidePanel method must be implemented");
  }

  async broadcastMessage(message, sender) {
    throw new Error("broadcastMessage method must be implemented");
  }
}