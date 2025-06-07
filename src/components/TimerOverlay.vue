<template>
  <div v-if="isOpen" class="do-rest-reminder">
    <div class="rest-overlay">
      <div class="rest-content">
        <div class="rest-icon">🎉</div>
        <h2 class="rest-title">L站虽好，但也要注意节制哦~</h2>
        <p class="rest-message">您已经学习 {{ minutes }} 分钟，超过0.1%佬友</p>
        <p class="rest-message">佬友你太牛逼了！！！</p>
        <p class="rest-tip">建议休息 5-10 分钟，放松一下眼睛和身体</p>
        <div class="rest-actions">
          <button class="close-btn" @click="closeBtn">关闭提醒</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  minutes: {
    type: Number,
    required: true,
    default: 0
  },
  show: {
    type: Boolean,
    required: true,
    default: false
  }
})

const isOpen = ref(props.show)

const closeBtn = () => {
  isOpen.value = false
}

</script>

<style scoped>
/* 休息提醒样式 */
.do-rest-reminder {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10001;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.rest-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.5s ease;
}

.rest-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.5s ease;
}

.rest-icon {
  font-size: 60px;
  margin-bottom: 20px;
  animation: bounce 2s ease infinite;
}

.rest-title {
  font-size: 28px;
  margin-bottom: 16px;
  font-weight: bold;
}

.rest-message {
  font-size: 18px;
  margin-bottom: 12px;
  opacity: 0.9;
}

.rest-tip {
  font-size: 14px;
  margin-bottom: 30px;
  opacity: 0.8;
}

.rest-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.continue-btn,
.close-btn {
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-btn {
  background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 动画定义 */
@keyframes gradientShift {

  0%,
  100% {
    background-position: 0% 50%;
  }

  33.33% {
    background-position: 100% 50%;
  }

  66.66% {
    background-position: 200% 50%;
  }
}

@keyframes borderGlow {

  0%,
  100% {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 rgba(45, 55, 72, 0);
  }

  50% {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(45, 55, 72, 0.4);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}
</style>
