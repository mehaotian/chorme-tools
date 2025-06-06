/**
 * 全局定时器管理器
 * 确保全局只有一个定时器实例，在所有页面同步显示
 */
export class GlobalTimerManager {
  constructor() {
    this.currentTimer = null; // 存储当前定时器的引用
    // 初始化定时器状态
    this.timerState = {
      isActive: false,
      totalMinutes: 0,
      remainingSeconds: 0,
      startTime: null,
      isPaused: false, // 新增：是否暂停
      pausedTime: null, // 新增：暂停时间点
    };
    this.isDestroyed = false; // 标记是否已销毁

    // 绑定清理方法到实例
    this.cleanup = this.cleanup.bind(this);

    // 监听扩展卸载事件
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onSuspend?.addListener(this.cleanup);
    }
  }

  /**
   * 启动新的定时器
   * @param {number} minutes - 定时分钟数
   */
  async startTimer(minutes) {
    // 检查实例是否已销毁
    if (this.isDestroyed) {
      console.warn("计时器管理器已被摧毁");
      return;
    }

    // 验证输入参数
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 1440) {
      console.error("无效的计时器持续时间:", minutes);
      return;
    }

    // 清除现有定时器，如果存在则清除
    this.clearExistingTimer();

    // 设置新的定时器状态
    this.timerState = {
      isActive: true,
      totalMinutes: minutes,
      remainingSeconds: minutes * 60,
      startTime: Date.now(),
      isPaused: false,
      pausedTime: null,
    };

    // 立即广播初始状态到所有标签页
    await this.broadcastTimerState();

    // 启动定时器，使用箭头函数确保this绑定正确
    this.currentTimer = setInterval(async () => {
      // 检查实例是否已销毁
      if (this.isDestroyed) {
        this.clearExistingTimer();
        return;
      }

      // 如果计时器暂停，不更新剩余时间
      if (this.timerState.isPaused) {
        return;
      }

      this.timerState.remainingSeconds--;

      if (this.timerState.remainingSeconds <= 0) {
        // 定时器结束
        await this.onTimerComplete();
      } else {
        // 广播当前状态到所有标签页
        await this.broadcastTimerState();
      }
    }, 1000);
  }

  /**
   * 暂停计时器
   */
  async pauseTimer() {
    if (!this.timerState.isActive || this.timerState.isPaused) {
      return;
    }

    this.timerState.isPaused = true;
    this.timerState.pausedTime = Date.now();
    await this.broadcastTimerState();
  }

  /**
   * 继续计时器
   */
  async resumeTimer() {
    if (!this.timerState.isActive || !this.timerState.isPaused) {
      return;
    }

    this.timerState.isPaused = false;
    this.timerState.pausedTime = null;
    await this.broadcastTimerState();
  }

  /**
   * 清除现有定时器
   */
  clearExistingTimer() {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.isDestroyed = true;
    this.clearExistingTimer();
    this.timerState.isActive = false;
  }

  /**
   * 停止当前定时器
   */
  async stopTimer() {
    this.clearExistingTimer();
    this.timerState.isActive = false;

    await this.broadcastMessage({
      action: "timer.stopped",
    });
  }

  /**
   * 定时器完成处理
   */
  async onTimerComplete() {
    if (this.isDestroyed) {
      return;
    }

    const totalMinutes = this.timerState.totalMinutes;
    this.clearExistingTimer();
    this.timerState.isActive = false;

    try {
      await this.sendToActiveTab({
        action: "timer.complete",
        totalMinutes: totalMinutes,
      });

      await this.broadcastMessage({
        action: "timer.stopped",
      });
    } catch (error) {
      console.error("Error in timer completion:", error);
    }
  }

  /**
   * 获取当前定时器状态
   * @returns {Object} 当前定时器状态
   */
  getTimerState() {
    return { ...this.timerState };
  }

  /**
   * 广播定时器状态到所有标签页
   */
  async broadcastTimerState() {
    const message = {
      action: "timer.update",
      timerState: { ...this.timerState },
    };

    await this.broadcastMessage(message);
  }

  /**
   * 向当前激活的标签页发送消息
   * @param {Object} message - 要发送的消息
   * @param {number} retries - 重试次数
   */
  async sendToActiveTab(message, retries = 2) {
    if (this.isDestroyed) {
      return;
    }
    const msgData = {
      action: "pageTimer",
      data: message,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (activeTab && activeTab.id) {
          try {
            await chrome.tabs.sendMessage(activeTab.id, msgData);
            return; // 成功发送，退出重试循环
          } catch (error) {
            if (attempt === retries) {
              console.warn(
                "Failed to send message to active tab after retries:",
                error.message
              );
            }
          }
        }
      } catch (error) {
        if (attempt === retries) {
          console.error("Failed to query active tab:", error.message);
        }
      }

      // 如果不是最后一次尝试，等待一段时间后重试
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * (attempt + 1))
        );
      }
    }
  }

  /**
   * 向所有标签页广播消息
   * @param {Object} message - 要广播的消息
   */
  async broadcastMessage(message) {
    if (this.isDestroyed) return;
    const msgData = {
      action: "pageTimer",
      data: message,
    };

    try {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log(activeTab && activeTab.id);
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(activeTab.id, msgData);
      }

      // 统计成功和失败的数量（仅在开发模式下）
      try {
        const successful = results.filter(
          (result) => result.status === "fulfilled"
        ).length;
        const failed = results.filter(
          (result) => result.status === "rejected"
        ).length;
        console.debug(
          `Broadcast message: ${successful} successful, ${failed} failed`
        );
      } catch (debugError) {
        // 忽略调试信息错误
      }
    } catch (error) {
      console.error("Failed to broadcast message:", error.message);
    }
  }
}
