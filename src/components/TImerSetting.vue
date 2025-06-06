<script setup>
import { ref, watchEffect } from 'vue'
import { chromeApi } from "../services/chrome-api";
import { Utils } from "../core/utils.js";
// tab 状态
let currentTab = ref('preset')
let hoursInput = ref(0)
let minutesInput = ref(0)

watchEffect(() => {
  if (hoursInput.value > 24) {
    hoursInput.value = 24
  }
  if (hoursInput.value < 0) {
    hoursInput.value = 0
  }
  if (minutesInput.value > 59) {
    minutesInput.value = 59
  }
  if (minutesInput.value < 0) {
    minutesInput.value = 0
  }
})

/**
 * 切换tab
 * @param tabName 
 */
const onModeClick = (tabName) => {
  currentTab.value = tabName
}

/**
 * 激活定时器
 * @param minutes 分钟
 */
const startTimer = async (minutes) => {
  console.log('-----', minutes)
  let totalMinutes = minutes
  // 选择时间
  if (minutes) {
    totalMinutes = minutes
  } else {
    // 自定义时间
    const hours = hoursInput.value
    const minutes = minutesInput.value

    if (!hours && !minutes) {
      Utils.showToast('请设置至少1分钟的计时时间！')
      return
    }

    totalMinutes = hours * 60 + minutes;

  }

  if (totalMinutes < 1) {
    Utils.showToast("请设置至少1分钟的计时时间！", "warning");
    return;
  }

  if (totalMinutes > 24 * 60) {
    Utils.showToast("计时时间不能超过24小时！", "warning");
    return;
  }


  const res = await chromeApi.sendMessage({
    action: 'pageTimer',
    data: {
      action: 'timer.start',
      minutes: totalMinutes
    }
  })
  console.log(res)
}


/**
 * 关闭窗口
 */
const cannelTimer = async () => {
  // 关闭定时器选择窗口
  // TODO

}




</script>
<template>
  <div class="timer-settings-overlay">
    <div class="timer-settings-modal">
      <div class="timer-settings-header">
        <h3>设置自律提醒时间</h3>
        <button class="close-btn" type="button" @click="cannelTimer">&times;</button>
      </div>
      <div class="timer-settings-content">
        <div class="timer-status" id="timer-status" style="display: none;">
          <div class="status-info">
            <span class="status-text" id="status-text">计时器正在运行中...</span>
            <span class="remaining-time" id="remaining-time"></span>
          </div>
          <div class="timer-controls">
            <button class="pause-resume-btn" id="pause-resume-btn" type="button">暂停</button>
            <button class="stop-timer-btn" type="button">停止计时器</button>
          </div>
        </div>
        <div class="time-input-group" id="time-input-group">
          <div class="input-mode-toggle">
            <button class="mode-btn" :class="{ active: currentTab === 'preset' }" data-mode="preset"
              @click="onModeClick('preset')">快速选择</button>
            <button class="mode-btn" :class="{ active: currentTab === 'custom' }" data-mode="custom"
              @click="onModeClick('custom')">自定义时间</button>
          </div>

          <div v-if="currentTab === 'preset'" class="preset-mode" id="preset-mode">
            <div class="preset-buttons">
              <button class="preset-btn" data-minutes="10" @click="startTimer(10)">10分钟</button>
              <button class="preset-btn" data-minutes="25" @click="startTimer(25)">25分钟</button>
              <button class="preset-btn" data-minutes="45" @click="startTimer(45)">45分钟</button>
              <button class="preset-btn" data-minutes="60" @click="startTimer(60)">1小时</button>
              <button class="preset-btn" data-minutes="120" @click="startTimer(120)">2小时</button>
              <button class="preset-btn" data-minutes="300" @click="startTimer(300)">5小时</button>
              <button class="preset-btn" data-minutes="720" @click="startTimer(720)">12小时</button>
              <button class="preset-btn" data-minutes="1440" @click="startTimer(1440)">24小时</button>
            </div>
          </div>

          <div v-if="currentTab === 'custom'" class="custom-mode" id="custom-mode">
            <label>自定义倒计时时间：</label>
            <div class="time-inputs">
              <div class="time-input-item">
                <input type="number" v-model="hoursInput" min="0" max="24" step="1" placeholder="0" />
                <span class="time-unit">小时</span>
              </div>
              <div class="time-input-item">
                <input type="number" v-model="minutesInput" min="0" max="59" step="1" placeholder="0" />
                <span class="time-unit">分钟</span>
              </div>
            </div>
            <div class="time-limit-hint">最大支持24小时倒计时</div>
          </div>
        </div>
        <div v-if="currentTab === 'custom'" class="action-buttons">
          <button class="start-timer-btn" @click="startTimer(null)">开始自律</button>
          <button class="cancel-btn" type="button" @click="cannelTimer">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.timer-settings-modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

.timer-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
}

.timer-settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.timer-settings-content {
  padding: 24px;
}

.time-input-group {
  margin-bottom: 24px;
}

.input-mode-toggle {
  display: flex;
  margin-bottom: 16px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(.active) {
  color: #475569;
}

.time-input-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.time-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.time-input-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input-item input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.time-input-item input:focus {
  outline: none;
  border-color: #007bff;
}

.time-unit {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  min-width: 30px;
}

.time-limit-hint {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  margin-top: 8px;
}

.preset-mode {
  margin-top: 8px;
}

.timer-status {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-text {
  font-weight: 500;
  color: #0369a1;
}

.remaining-time {
  font-weight: 600;
  color: #0c4a6e;
  font-size: 16px;
}

.timer-controls {
  display: flex;
  gap: 8px;
}

.pause-resume-btn {
  flex: 1;
  padding: 10px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pause-resume-btn:hover {
  background: #d97706;
}

.pause-resume-btn.paused {
  background: #10b981;
}

.pause-resume-btn.paused:hover {
  background: #059669;
}

.stop-timer-btn {
  flex: 1;
  padding: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stop-timer-btn:hover {
  background: #dc2626;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.preset-btn {
  flex: 1;
  min-width: 70px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.start-timer-btn,
.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-timer-btn {
  background: #6366f1;
  color: white;
}

.start-timer-btn:hover {
  background: #5855eb;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}
</style>
