<template>
  <div class="deep-work-timer">
    <div class="timer-display-content">
      <div class="timer-label-text">
        距离休息还有
      </div>
      <div class="timer-time-display">{{ formatTimeDisplay(minutes)}}</div>
      <div class="timer-status-text">疯狂摄取知识中</div>
    </div>
  </div>

</template>

<script setup>
import { unref } from 'vue'

defineProps({
  // 定义属性
  minutes: {
    type: Number,
    required: true,
    default: 0
  }
})
/**
  * 格式化时间显示
  * @param {number} totalSeconds - 总秒数
  * @param {number} originalMinutes - 原始分钟数（用于进度计算）
  * @returns {string} 格式化的HTML内容
  */
function formatTimeDisplay(seconds) {
  const totalSeconds = unref(seconds)
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  let timeText = "";
  if (hours > 0) {
    timeText = `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    timeText = `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return timeText
}

</script>

<style scoped>
/* 定时器主体样式 */
.deep-work-timer {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(74, 85, 104, 0.9));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: white;
  padding: 18px;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 2147483647;
  font-family: 'Digital', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 100px;
  user-select: none;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  will-change: transform, opacity;
  transform: translateZ(0);
  opacity: 0;
}

.deep-work-timer.timer-active {
  opacity: 1;
  transform: translateY(0) scale(1);
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(74, 85, 104, 0.9), rgba(113, 128, 150, 0.85));
  background-size: 200% 200%;
  animation: gradientShift 6s cubic-bezier(0.4, 0, 0.6, 1) infinite, borderGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.deep-work-timer.timer-hiding {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(20px) scale(0.8);
  opacity: 0;
}

/* 定时器悬停遮罩 */
.timer-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10;
}

.timer-hover-overlay.visible {
  opacity: 1;
  visibility: visible;
}

/* 停止按钮 */
.timer-stop-button {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
  transform: scale(0.9);
}

.timer-stop-button:hover {
  transform: scale(1) translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.6);
}

/* 定时器显示内容 */
.timer-display-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  font-family: 'Digital', sans-serif;
}

.timer-label-text {
  opacity: 0.9;
  z-index: 10;
  position: relative;
  color: #FFB74D;
}

.timer-time-display {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Digital', 'Courier New', 'Lucida Console', monospace;
  text-shadow: 0 0 10px rgba(255, 183, 77, 0.8), 0 0 20px rgba(255, 183, 77, 0.4), 0 0 30px rgba(255, 183, 77, 0.2);
  letter-spacing: 2px;
  z-index: 10;
  position: relative;
  color: #FFB74D;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 12px;
  line-height: 1;
  border-radius: 8px;
  border: 1px solid rgba(255, 183, 77, 0.3);
}

.timer-status-text {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 10;
  position: relative;
}

.timer-progress-container {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.25;
}

.timer-progress-svg {
  transform: scale(0.4);
}

.timer-progress-circle {
  transition: stroke-dashoffset 1s ease-in-out;
  filter: drop-shadow(0 0 3px rgba(255, 183, 77, 0.5));
}
</style>
