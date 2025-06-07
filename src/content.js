import { createApp, ref } from "vue";
import Timer from "./components/Timer.vue";
import TimerOverlay from "./components/TimerOverlay.vue";
import { UI_CONSTANTS } from './core/app-constants.js';

/**
 * 全局定时器显示类
 * 负责在网页中显示全局定时器
 */
class GlobalTimerDisplay {
  constructor() {
    this.minutes = ref(0);
    this.timerElement = null; // 存储定时器元素
    this.isVisible = false; // 存储定时器是否可见
    this.currentState = null; // 存储当前状态
    this.isDestroyed = false; // 标记是否已销毁
    this.eventListeners = new Map(); // 跟踪事件监听器
    this.animationFrameId = null; // 存储动画帧ID

    // 绑定方法到实例
    this.cleanup = this.cleanup.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);

    // 监听页面卸载事件
    this.addEventListenerTracked(window, "beforeunload", this.cleanup);
    this.addEventListenerTracked(
      document,
      "visibilitychange",
      this.handleVisibilityChange
    );
    this.addEventListenerTracked(window, "focus", this.handleWindowFocus);
  }

  /**
   * 创建定时器显示元素
   */
  createTimerElement(minutes) {
    if (this.timerElement || this.isDestroyed) {
      return;
    }
    if (minutes) {
      this.minutes.value = minutes;
    }

    this.timerElement = document.createElement("div");
    this.timerElement.id = "do-root";
    document.body.append(this.timerElement);
    const app = createApp(Timer, { minutes: this.minutes });

    this.addFontStyles();

    app.mount(this.timerElement);

    this.startTimerAnimation();
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.isDestroyed) {
      return;
    }

    if (isExtensionContextValid()) {
      try {
        chrome.runtime.sendMessage({ action: "stopTimer" });
      } catch (error) {
        console.warn("Failed to send stop timer message:", error.message);
      }
    }
    this.hideTimerWithAnimation();
  }

  /**
   * 带动画的隐藏定时器
   */
  hideTimerWithAnimation() {
    if (!this.timerElement || this.isDestroyed) return;
    const dom = this.timerElement.querySelector(".deep-work-timer");
    dom.classList.add("timer-hiding");

    const hideTimeout = setTimeout(() => {
      if (
        this.timerElement &&
        this.timerElement.parentNode &&
        !this.isDestroyed
      ) {
        this.timerElement.parentNode.removeChild(this.timerElement);
        this.timerElement = null;
        this.isVisible = false;
      }
    }, 500);

    // 如果组件被销毁，立即清理
    if (this.isDestroyed) {
      clearTimeout(hideTimeout);
    }
  }

  /**
   * 添加字体样式
   */
  addFontStyles() {
    if (document.getElementById("do-timer-font-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "do-timer-font-styles";
    style.textContent = `
      @font-face {
        font-family: 'Digital';
        src: url(chrome-extension://${chrome.runtime.id}/digital.ttf) format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 启动定时器动画
   */
  startTimerAnimation() {
    setTimeout(() => {
      const dom = this.timerElement.querySelector(".deep-work-timer");
      dom.classList.add("timer-active");
    }, UI_CONSTANTS.ANIMATION_DELAY);
  }

  /**
   * 更新定时器内容
   * @param {Object} timerState - 定时器状态
   */
  updateTimerContent(timerState) {
    if (!this.timerElement || this.isDestroyed) {
      return;
    }

    const minutes = timerState.remainingSeconds;
    if (minutes) {
      this.minutes.value = minutes;
    }
  }

  /**
   * 更新定时器显示
   * @param {Object} timerState - 定时器状态
   */
  updateDisplay(timerState) {
    if (this.isDestroyed) {
      return;
    }

    if (!timerState || !timerState.isActive) {
      this.hideTimer();
      return;
    }

    this.currentState = timerState;

    if (!this.isVisible) {
      this.createTimerElement(timerState.remainingSeconds);
    }

    this.updateTimerContent(timerState);
  }

  /**
   * 显示休息提醒
   * @param {number} totalMinutes - 总计时分钟数
   */
  showRestReminder(minutes) {
    this.hideTimer();

    // // 创建休息提醒界面
    // const reminderElement = document.createElement("div");
    // reminderElement.id = "do-rest-reminder";
    // reminderElement.innerHTML = `
    //   <div class="rest-overlay">
    //     <div class="rest-content">
    //       <div class="rest-icon">🎉</div>
    //       <h2 class="rest-title">L站虽好，但也要注意节制哦~</h2>
    //       <p class="rest-message">您已经学习 ${totalMinutes} 分钟，超过0.1%佬友</p>
    //       <p class="rest-message">佬友你太牛逼了！！！</p>
    //       <p class="rest-tip">建议休息 5-10 分钟，放松一下眼睛和身体</p>
    //       <div class="rest-actions">
    //         <button class="close-btn">关闭提醒</button>
    //       </div>
    //     </div>
    //   </div>
    // `;

    // const closeBtn = reminderElement.querySelector(".close-btn");

    // const closeReminder = () => {
    //   if (document.body.contains(reminderElement)) {
    //     document.body.removeChild(reminderElement);
    //   }
    // };

    // if (closeBtn) {
    //   closeBtn.addEventListener("click", closeReminder);
    // }

    // setTimeout(closeReminder, 30000);

    // document.body.appendChild(reminderElement);

    // /   if (document.getElementById("do-root")) return;

    let root = document.querySelector("#do-rest-reminder");
    if (root) {
      root.parentNode.removeChild(root);
    }
    root = document.createElement("div");
    root.id = "do-rest-reminder";

    document.body.append(root);
    const app = createApp(TimerOverlay, { minutes, show: true });
    app.mount(root);
  }

  /**
   * 隐藏定时器
   */
  hideTimer() {
    if (this.timerElement && !this.isDestroyed) {
      this.hideTimerWithAnimation();
    }
  }

  /**
   * 添加事件监听器并跟踪
   */
  addEventListenerTracked(element, event, handler, options) {
    if (this.isDestroyed) return;

    element.addEventListener(event, handler, options);

    // 跟踪事件监听器以便后续清理
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler, options });
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (!document.hidden && !this.isDestroyed) {
      this.checkExistingTimer();
    }
  }

  /**
   * 处理窗口焦点变化
   */
  handleWindowFocus() {
    if (!this.isDestroyed) {
      this.checkExistingTimer();
    }
  }

  /**
   * 检查现有定时器状态
   */
  checkExistingTimer() {
    if (this.isDestroyed || !isExtensionContextValid()) {
      return;
    }

    try {
      chrome.runtime.sendMessage(
        { action: "pageTimer", data: { action: "timer.get" } },
        (response) => {
          if (this.isDestroyed) return;
          if (chrome.runtime.lastError) {
            console.warn(
              "Error getting timer state:",
              chrome.runtime.lastError.message
            );
            return;
          }
          const data = response.data;
          if (data && data.timerState && data.timerState.isActive) {
            this.updateDisplay(data.timerState);
          }
        }
      );
    } catch (error) {
      console.warn("Failed to check existing timer:", error.message);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.isDestroyed = true;

    // 清理动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 清理事件监听器
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn("Error removing event listener:", error.message);
        }
      });
    });
    this.eventListeners.clear();

    // 清理DOM元素
    if (this.timerElement && this.timerElement.parentNode) {
      this.timerElement.parentNode.removeChild(this.timerElement);
      this.timerElement = null;
    }

    this.isVisible = false;
  }
}

// 创建全局时间实例
let globalTimerDisplay = null;

// 初始化函数
function initializeTimerDisplay() {
  if (!globalTimerDisplay) {
    // 首先注入字体样式
    globalTimerDisplay = new GlobalTimerDisplay();

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!globalTimerDisplay || globalTimerDisplay.isDestroyed) {
        return;
      }
      const data = request.data;
      // console.log('action is',data.action,'data is',data);
      
      if (data) {
        if (data.action === "timer.start") {
          globalTimerDisplay.createTimerElement(data.remainingSeconds);
        } else if (data.action === "timer.update") {
          const timerState = data.timerState;
          if (timerState) {
            globalTimerDisplay.updateDisplay(timerState);
          }
        } else if (data.action === "timer.stopped") {
          globalTimerDisplay.hideTimer();
        } else if (data.action === "timer.complete") {
          globalTimerDisplay.showRestReminder(data.totalMinutes || 0);
        }else if (data.action === "timer.get") {
          const timerState = data.timerState;
          if (data && timerState && !timerState.isActive) {
            globalTimerDisplay.hideTimer();
          }
        }
      }
    });

    // 检查现有定时器
    globalTimerDisplay.checkExistingTimer();
  }
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTimerDisplay);
} else {
  initializeTimerDisplay();
}

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 扩展上下文是否有效
 */
function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}
