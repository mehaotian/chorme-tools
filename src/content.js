console.log("content script loaded");
import { createApp } from "vue";
import Timer from "./components/Timer.vue";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const data = request.data;
  if (data && data.action === "timer.open") {
    createTimer();
  }
  console.log("message received", request);
});

function createTimer() {
  // 如果存在 ，不重复创建
  if (document.getElementById("do-root")) return;

  const root = document.createElement("div");
  root.id = "do-root";
  document.body.append(root);
  const app = createApp(Timer);
  app.mount(root);
}

/**
 * 加载字体样式
 * @returns {void}
 */
function addFontStyles() {
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

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addFontStyles);
} else {
  addFontStyles();
}
