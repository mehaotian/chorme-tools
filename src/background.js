/**
 * Chrome 扩展 Background Script
 * 负责处理所有组件间的消息转发和路由
 * 支持 popup、content-scripts、侧栏等组件的统一通信
 */
import { ChromeMessageRouter } from './core/chrome-message-router.js';

// 创建消息路由器实例
const messageRouter = new ChromeMessageRouter();

// 配置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  // 设置点击扩展图标时不自动打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  console.log("🎯 扩展已安装，消息路由器已启动");
});

/**
 * 扩展启动时的处理
 */
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 扩展已启动，消息路由器运行中");
});

// 导出消息路由器（用于测试）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { MessageRouter, messageRouter };
}
