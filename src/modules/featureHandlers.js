/**
 * 功能处理器模块
 * 处理各种扩展功能的业务逻辑
 */

import { chromeApi } from '../services/chrome-api.js';
import { TIME_CONSTANTS } from '../core/app-constants.js';

/**
 * 计时器功能处理器
 */
class TimerHandler {
  /**
   * 启动计时器
   * @param {number} minutes - 计时分钟数
   */
  static async handle(minutes) {
    try {
      if (!chromeApi.isExtensionEnvironment()) {
        throw new Error('扩展上下文无效');
      }
      
      // 验证输入参数
      if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
        throw new Error('时间数字无效');
      }
      
      if (minutes > TIME_CONSTANTS.MAX_TIMER_MINUTES) {
      throw new Error('计时器持续时间不能超过24小时');
      }
      
      // 发送消息给后台脚本，通知后台脚本开始计时
      await chromeApi.sendMessage({
        action: 'startTimer',
        minutes: minutes
      });
      
      if (typeof showNotification === 'function') {
        showNotification(`自律提醒已设置：${minutes}分钟`, "success");
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      
      let errorMessage = '启动计时器失败';
      if (error.message.includes('Invalid minutes')) {
        errorMessage = '无效的时间设置';
      } else if (error.message.includes('exceed 24 hours')) {
      errorMessage = '计时时间不能超过24小时';
      } else if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, 'error');
      }
    }
  }

  /**
   * 停止计时器
   */
  static async stop() {
    try {
      if (!chromeApi.isExtensionEnvironment()) {
        throw new Error('Extension context is invalid');
      }
      
      await chromeApi.sendMessage({ action: "stopTimer" });
      
      if (typeof showNotification === 'function') {
        showNotification('计时器已停止', 'info');
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
      
      let errorMessage = '停止计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, 'error');
      }
    }
  }

  /**
   * 暂停计时器
   */
  static async pause() {
    try {
      if (!chromeApi.isExtensionEnvironment()) {
        throw new Error('Extension context is invalid');
      }
      
      await chromeApi.sendMessage({ action: "pauseTimer" });
      
      if (typeof showNotification === 'function') {
        showNotification('计时器已暂停', 'info');
      }
    } catch (error) {
      console.error('Failed to pause timer:', error);
      
      let errorMessage = '暂停计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, 'error');
      }
    }
  }

  /**
   * 继续计时器
   */
  static async resume() {
    try {
      if (!chromeApi.isExtensionEnvironment()) {
        throw new Error('Extension context is invalid');
      }
      
      await chromeApi.sendMessage({ action: "resumeTimer" });
      
      if (typeof showNotification === 'function') {
        showNotification('计时器已继续', 'info');
      }
    } catch (error) {
      console.error('Failed to resume timer:', error);
      
      let errorMessage = '继续计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      if (typeof showNotification === 'function') {
        showNotification(errorMessage, 'error');
      }
    }
  }

  /**
   * 获取计时器状态
   * @returns {Promise<Object>} 计时器状态
   */
  static async getStatus() {
    try {
      if (!chromeApi.isExtensionEnvironment()) {
        throw new Error('Extension context is invalid');
      }
      
      const response = await chromeApi.sendMessage({ action: "getTimerState" });
      return response || { isRunning: false };
    } catch (error) {
      console.error('Failed to get timer status:', error);
      return { isRunning: false, error: error.message };
    }
  }
}

// 导出计时器处理器类
export { TimerHandler };