<script setup>
import { ref } from 'vue'
import TImerSetting from '../components/TImerSetting.vue';

let isOpenTimer = ref(false)


const clickHandler = (type) => {
  switch (type) {
    // 自律提醒
    case 'reading':
      isOpenTimer.value = true
      break;
    // 统计字数
    case 'stat':
      // TODO 待实现
      break;
    // 页面美化
    case 'beautify':
      openSidebar();
      break;
    default:
      break;
  }
}

/**
 * 打开侧栏
 * 
 * @return {*}
 */
async function openSidebar() {
  await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });

  // 关闭弹窗
  if (window && window.close) {
    window.close();
  }
}

</script>

<template>
  <div class="popup-container">
    <div class="header">
      <h2 class="title">DO 助手</h2>
      <p class="subtitle">L 站小助手，聚合多种常规小功能</p>
    </div>

    <div class="feature-list" @click="clickHandler('reading')">
      <div class="feature-item" data-feature="reading-time">
        <div class="feature-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
        <div class="feature-content">
          <h3 class="feature-title">自律提醒！</h3>
          <p class="feature-description">看L站太久了，适当休息一会吧</p>
        </div>
        <div class="feature-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>

      <!-- <div class="feature-item" data-feature="word-count" @click="clickHandler('word')">
        <div class="feature-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        </div>
        <div class="feature-content">
          <h3 class="feature-title">字数统计</h3>
          <p class="feature-description">统计页面文字数量</p>
        </div>
        <div class="feature-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>

      <div class="feature-item" data-feature="bookmark">
        <div class="feature-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <div class="feature-content">
          <h3 class="feature-title">快速收藏</h3>
          <p class="feature-description">一键收藏当前页面</p>
        </div>
        <div class="feature-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div> -->

      <div class="feature-item" data-feature="page-beautify" @click="clickHandler('beautify')">
        <div class="feature-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div class="feature-content">
          <h3 class="feature-title">页面美化</h3>
          <p class="feature-description">自定义页面样式和主题</p>
        </div>
        <div class="feature-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>

      <div class="feature-item" data-feature="settings">
        <div class="feature-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path
              d="m12 1 1.68 3.36L17 6.04l.32 3.68L21 12l-3.68 2.28L17 17.96l-3.32 1.68L12 23l-1.68-3.36L7 17.96l-.32-3.68L3 12l3.68-2.28L7 6.04l3.32-1.68L12 1z" />
          </svg>
        </div>
        <div class="feature-content">
          <h3 class="feature-title">设置</h3>
          <p class="feature-description">扩展设置和配置</p>
        </div>
        <div class="feature-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </div>
      </div>
    </div>

    <div class="footer">
      <p class="version">版本 1.0</p>
    </div>
    <TImerSetting v-model="isOpenTimer"></TImerSetting>
  </div>
</template>

<style scoped>
.popup-container {
  /* padding: 20px; */
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100vh;
}

/* 头部样式 - 现代化渐变设计 */
.header {
  flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: white;
  padding: 20px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  border-bottom: none;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  animation: shimmer 4s infinite ease-in-out;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

/* 功能列表 - 现代化卡片设计 */
.feature-list {
  padding: 0px 15px;
  margin: 0;
  list-style: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.5s ease;
}

.feature-item:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(99, 102, 241, 0.05) 100%);
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
}

.feature-item:hover::before {
  left: 100%;
}

.feature-item:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.feature-item.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: #6366f1;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.feature-item.active .feature-title,
.feature-item.active .feature-description {
  color: white;
}

.feature-item.active .feature-icon {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}


/* 功能项图标 - 现代化设计 */
.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-item:hover .feature-icon::before {
  opacity: 1;
}

/* 功能项内容 - 现代化布局 */
.feature-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  z-index: 1;
  min-width: 0;
}

.feature-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
  letter-spacing: -0.01em;
  transition: color 0.3s ease;
}

.feature-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  transition: color 0.3s ease;
}

/* 功能项箭头 - 增强动画 */
.feature-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.7;
}

.feature-item:hover .feature-arrow {
  transform: translateX(4px) scale(1.1);
  color: #6366f1;
  opacity: 1;
}

/* 页脚样式 - 现代化设计 */
.footer {
  text-align: center;
  padding: 12px 16px 8px;
  position: relative;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
}

.version {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.025em;
}
</style>
