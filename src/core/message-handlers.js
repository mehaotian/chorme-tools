/**
 * 消息处理器
 * 处理具体的业务逻辑消息
 */
import { GlobalTimerManager } from "../services/timer.js";
import { StorageService } from '../services/storage.js';
import { Utils } from './utils.js';
import { TIME_CONSTANTS } from './app-constants.js';

export class MessageHandlers {
  constructor() {
    this.globalTimer = new GlobalTimerManager();
  }

  /**
   * 处理定时器消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} forwardToContentScript - 转发到content script的函数
   * @returns {Promise<Object>} 处理结果
   */
  async handlePageTimerMessage(message, sender, forwardToContentScript) {
    console.log("🚀 处理定时器消息:", message);
    const data = message.data;
    const minutes = data.minutes;
    const action = data.action;
    console.log("-=-=-=", action);
    
    if (action === "timer.start") {
      await this.globalTimer.startTimer(minutes);
      message.data.remainingSeconds = message.data.minutes * TIME_CONSTANTS.SECONDS_PER_MINUTE;
    } else if (action === "timer.get") {
      const timerState = await this.globalTimer.getTimerState();
      message.data.timerState = timerState;
    } else if (action === "timer.stopped") {
      await this.globalTimer.stopTimer();
    }

    // 消息最终也是要转发到content script
    return await forwardToContentScript(
      {
        action: message.action,
        data: message.data,
      },
      sender
    );
  }

  /**
   * 处理页面美化相关消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} forwardToContentScript - 转发到content script的函数
   * @returns {Promise<Object>} 处理结果
   */
  async handlePageBeautifyMessage(message, sender, forwardToContentScript) {
    // 页面美化消息通常需要转发到content script
    return await forwardToContentScript(
      {
        ...message,
        action: "forwardToContentScript",
        data: message,
      },
      sender
    );
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
        case "get":
          result = await chrome.storage.local.get(data.keys);
          break;

        case "set":
          await chrome.storage.local.set(data.items);
          result = { success: true };
          break;

        case "remove":
          await chrome.storage.local.remove(data.keys);
          result = { success: true };
          break;

        case "clear":
          await chrome.storage.local.clear();
          result = { success: true };
          break;

        default:
          throw new Error(`未知的存储操作类型: ${type}`);
      }

      return {
        success: true,
        data: result,
        messageId: message.messageId,
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
        case "query":
          result = await chrome.tabs.query(data.queryInfo || {});
          break;

        case "get":
          result = await chrome.tabs.get(data.tabId);
          break;

        case "update":
          result = await chrome.tabs.update(data.tabId, data.updateProperties);
          break;

        case "reload":
          await chrome.tabs.reload(data.tabId, data.reloadProperties);
          result = { success: true };
          break;

        default:
          throw new Error(`未知的标签页操作类型: ${type}`);
      }

      return {
        success: true,
        data: result,
        messageId: message.messageId,
      };
    } catch (error) {
      throw new Error(`标签页操作失败: ${error.message}`);
    }
  }

  /**
   * 处理系统消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} getMessageQueue - 获取消息队列的函数
   * @returns {Promise<Object>} 处理结果
   */
  async handleSystemMessage(message, sender, getMessageQueue) {
    const { type, data } = message;

    switch (type) {
      case "ping":
        return {
          success: true,
          data: { pong: true, timestamp: Date.now() },
          messageId: message.messageId,
        };

      case "getExtensionInfo":
        return {
          success: true,
          data: {
            id: chrome.runtime.id,
            version: chrome.runtime.getManifest()?.version,
            name: chrome.runtime.getManifest()?.name,
          },
          messageId: message.messageId,
        };

      case "getMessageQueue":
        const queueKey = data.target + "_messages";
        const queue = getMessageQueue(queueKey);

        return {
          success: true,
          data: { messages: queue },
          messageId: message.messageId,
        };

      default:
        throw new Error(`未知的系统消息类型: ${type}`);
    }
  }

  /**
   * 处理未知消息类型
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} forwardToContentScript - 转发到content script的函数
   * @returns {Promise<Object>} 处理结果
   */
  async handleUnknownMessage(message, sender, forwardToContentScript) {
    console.warn("⚠️ 收到未知消息类型:", message.action);

    // 尝试转发到content script
    if (sender.tab) {
      return await forwardToContentScript(
        {
          ...message,
          action: "forwardToContentScript",
          data: message,
        },
        sender
      );
    }

    return {
      success: false,
      error: `未知的消息类型: ${message.action}`,
      code: "UNKNOWN_MESSAGE_TYPE",
      messageId: message.messageId,
    };
  }

  /**
   * 增强转发到popup的处理，添加定时器状态
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} forwardToPopup - 转发到popup的函数
   * @returns {Promise<Object>} 处理结果
   */
  async enhancedForwardToPopup(message, sender, forwardToPopup) {
    const { data } = message;
    
    if (data && data.action === "timer.get") {
      console.log("DATA", data);
      const timerState = await this.globalTimer.getTimerState();
      data.timerState = timerState;
    }

    return await forwardToPopup(message, sender);
  }
}