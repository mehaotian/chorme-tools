/**
 * 功能处理器模块
 * 处理各种扩展功能的业务逻辑
 */


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
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('扩展上下文无效');
      }
      
      // 验证输入参数
      if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
        throw new Error('时间数字无效');
      }
      
      if (minutes > 24 * 60) {
        throw new Error('计时器持续时间不能超过24小时');
      }
      
      // 发送消息给后台脚本，通知后台脚本开始计时
      await ChromeAPIManager.sendMessage({
        action: 'startTimer',
        minutes: minutes
      });
      showNotification(`自律提醒已设置：${minutes}分钟`, "success");
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
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 停止计时器
   */
  static async stop() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "stopTimer" });
      showNotification('计时器已停止', 'info');
    } catch (error) {
      console.error('Failed to stop timer:', error);
      
      let errorMessage = '停止计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 暂停计时器
   */
  static async pause() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "pauseTimer" });
      showNotification('计时器已暂停', 'info');
    } catch (error) {
      console.error('Failed to pause timer:', error);
      
      let errorMessage = '暂停计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 继续计时器
   */
  static async resume() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "resumeTimer" });
      showNotification('计时器已继续', 'info');
    } catch (error) {
      console.error('Failed to resume timer:', error);
      
      let errorMessage = '继续计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 获取计时器状态
   * @returns {Promise<Object>} 计时器状态
   */
  static async getStatus() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      const response = await ChromeAPIManager.sendMessage({ action: "getTimerState" });
      return response || { isRunning: false };
    } catch (error) {
      console.error('Failed to get timer status:', error);
      return { isRunning: false, error: error.message };
    }
  }
}

/**
 * 功能处理器映射表
 */
export const featureHandlers = {
  "reading-time": ReadingTimeHandler.handle,
  "word-count": WordCountHandler.handle,
  "bookmark": BookmarkHandler.handle,
  "page-beautify": PageBeautifyHandler.handle,
  "settings": SettingsHandler.handle,
};

// 导出各个处理器类
export {
  ChromeAPIManager,
  ReadingTimeHandler,
  WordCountHandler,
  BookmarkHandler,
  PageBeautifyHandler,
  SettingsHandler,
  TimerHandler,
  countWordsInPage
};