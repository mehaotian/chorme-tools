import { MESSAGE_CONSTANTS } from './app-constants.js';

/**
 * 消息转发器
 * 实现具体的消息转发逻辑
 */
export class MessageForwarder {
  constructor() {
    this.messageQueue = new Map();
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
    let targetTabId = tabId || sender.tab?.id;

    // 如果没有指定标签页ID，获取当前激活的标签页
    if (!targetTabId) {
      try {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        targetTabId = activeTab?.id;
      } catch (error) {
        console.warn("获取当前激活标签页失败:", error);
      }
    }

    if (!targetTabId) {
      throw new Error("无法确定目标标签页ID");
    }

    try {
      // 构造转发消息
      const forwardMessage = {
        action: message.action,
        data: data || {},
        originalSender: this.getSenderInfo(sender),
        messageId: message.messageId,
        timestamp: Date.now(),
      };

      // 发送到content script
      const response = await chrome.tabs.sendMessage(
        targetTabId,
        forwardMessage
      );

      return {
        success: true,
        response,
        target: "content-script",
        tabId: targetTabId,
        messageId: message.messageId,
        ...forwardMessage,
      };
    } catch (error) {
      // 如果content script未加载，尝试注入
      if (error.message.includes("Could not establish connection")) {
        console.log(`🔄 尝试注入content script到标签页 ${targetTabId}`);
        await this.injectContentScript(targetTabId);

        // 重试发送消息
        const response = await chrome.tabs.sendMessage(targetTabId, {
          action: message.action,
          data: data || {},
          originalSender: this.getSenderInfo(sender),
          messageId: message.messageId,
          timestamp: Date.now(),
        });

        return {
          success: true,
          data: response,
          target: "content-script",
          tabId: targetTabId,
          messageId: message.messageId,
          injected: true,
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
      ...(data || {}),
      action: message.action,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      target: "popup",
    };

    // 存储消息到队列中
    const queueKey = "popup_messages";
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }

    this.messageQueue.get(queueKey).push(forwardMessage);

    // 限制队列长度
    const queue = this.messageQueue.get(queueKey);
    if (queue.length > MESSAGE_CONSTANTS.MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MESSAGE_CONSTANTS.MAX_QUEUE_SIZE);
    }

    return {
      success: true,
      data: forwardMessage,
      target: "popup",
      messageId: message.messageId,
      queued: true,
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
      ...(data || {}),
      action: message.action,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      target: "sidepanel",
    };

    // 存储消息到队列中
    const queueKey = "sidepanel_messages";
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }

    this.messageQueue.get(queueKey).push(forwardMessage);

    // 限制队列长度
    const queue = this.messageQueue.get(queueKey);
    if (queue.length > MESSAGE_CONSTANTS.MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MESSAGE_CONSTANTS.MAX_QUEUE_SIZE);
    }

    return {
      success: true,
      data: forwardMessage,
      target: "sidepanel",
      messageId: message.messageId,
      queued: true,
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
      ...(data || {}),
      action: message.action,
      originalSender: this.getSenderInfo(sender),
      messageId: message.messageId,
      timestamp: Date.now(),
      broadcast: true,
    };

    try {
      // 广播到所有活动标签页的content script
      const tabs = await chrome.tabs.query({ active: true });

      for (const tab of tabs) {
        if (excludeSender && sender.tab?.id === tab.id) {
          continue;
        }

        try {
          const response = await chrome.tabs.sendMessage(
            tab.id,
            broadcastMessage
          );
          results.push({
            target: "content-script",
            tabId: tab.id,
            success: true,
            data: response,
          });
        } catch (error) {
          results.push({
            target: "content-script",
            tabId: tab.id,
            success: false,
            error: error.message,
          });
        }
      }

      // 广播到popup和侧栏（通过消息队列）
      ["popup_messages", "sidepanel_messages"].forEach((queueKey) => {
        if (!this.messageQueue.has(queueKey)) {
          this.messageQueue.set(queueKey, []);
        }
        this.messageQueue.get(queueKey).push(broadcastMessage);
      });

      return {
        success: true,
        target: "broadcast",
        messageId: message.messageId,
        results,
      };
    } catch (error) {
      throw new Error(`广播消息失败: ${error.message}`);
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
        files: ["src/content.js"],
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
   * 获取消息队列
   * @param {string} queueKey - 队列键
   * @returns {Array} 消息队列
   */
  getMessageQueue(queueKey) {
    const queue = this.messageQueue.get(queueKey) || [];
    // 清空队列
    this.messageQueue.set(queueKey, []);
    return queue;
  }
}