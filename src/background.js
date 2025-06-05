/**
 * 负责处理popup和content script之间的消息转发
 */

// 配置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  // 设置点击扩展图标时不自动打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});


/**
 * 监听来自popup和content script的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 验证消息格式
  if (!request || typeof request !== "object" || !request.action) {
    console.warn("Invalid message format received:", request);
    return false;
  }
  return true;
});

/**
 * 扩展安装或启动时的初始化
 */
chrome.runtime.onInstalled.addListener((details) => {
  // 扩展安装或更新时的初始化逻辑
  // TODO 暂时没有需求使用
});

/**
 * 扩展启动时的处理
 */
chrome.runtime.onStartup.addListener(() => {
  // 扩展启动时的初始化逻辑
  // TODO 暂时没有需求使用
});
