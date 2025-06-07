/**
 * Chrome 扩展消息路由器实现
 * 继承基础消息路由器，实现具体的Chrome扩展功能
 */
import { MessageRouter } from './message-router.js';
import { MessageForwarder } from './message-forwarder.js';
import { MessageHandlers } from './message-handlers.js';

export class ChromeMessageRouter extends MessageRouter {
  constructor() {
    super();
    this.forwarder = new MessageForwarder();
    this.handlers = new MessageHandlers();
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

      // 定时器相关消息
      case "pageTimer":
        return await this.handlers.handlePageTimerMessage(
          message, 
          sender, 
          this.forwardToContentScript.bind(this)
        );

      // 页面美化相关消息
      case "pageBeautify":
        return await this.handlers.handlePageBeautifyMessage(
          message, 
          sender, 
          this.forwardToContentScript.bind(this)
        );

      // 存储相关消息
      case "storage":
        return await this.handlers.handleStorageMessage(message, sender);

      // 标签页相关消息
      case "tabs":
        return await this.handlers.handleTabsMessage(message, sender);

      // 系统消息
      case "system":
        return await this.handlers.handleSystemMessage(
          message, 
          sender, 
          this.forwarder.getMessageQueue.bind(this.forwarder)
        );

      default:
        // 未知消息类型，尝试智能路由
        return await this.smartRoute(message, sender);
    }
  }

  /**
   * 实现转发到content script
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToContentScript(message, sender) {
    return await this.forwarder.forwardToContentScript(message, sender);
  }

  /**
   * 实现转发到popup
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToPopup(message, sender) {
    return await this.handlers.enhancedForwardToPopup(
      message, 
      sender, 
      this.forwarder.forwardToPopup.bind(this.forwarder)
    );
  }

  /**
   * 实现转发到侧栏
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 转发结果
   */
  async forwardToSidePanel(message, sender) {
    return await this.forwarder.forwardToSidePanel(message, sender);
  }

  /**
   * 实现广播消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @returns {Promise<Object>} 广播结果
   */
  async broadcastMessage(message, sender) {
    return await this.forwarder.broadcastMessage(message, sender);
  }

  /**
   * 处理连接
   * @param {Object} port - 连接端口
   */
  handleConnection(port) {
    console.log("🔗 新连接建立:", port.name);

    this.activeConnections.set(port.name, port);

    port.onDisconnect.addListener(() => {
      console.log("🔌 连接断开:", port.name);
      this.activeConnections.delete(port.name);
    });

    port.onMessage.addListener((message) => {
      console.log("📨 通过连接收到消息:", port.name, message);
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
    if (changeInfo.status === "complete") {
      console.log(`📄 标签页加载完成: ${tabId} - ${tab.url}`);

      // 清理该标签页的消息队列
      const queueKey = `tab_${tabId}_messages`;
      if (this.forwarder.messageQueue.has(queueKey)) {
        this.forwarder.messageQueue.delete(queueKey);
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
    if (this.forwarder.messageQueue.has(queueKey)) {
      this.forwarder.messageQueue.delete(queueKey);
    }
  }
}