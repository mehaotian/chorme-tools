<script setup>
import { ref } from 'vue'

const onClick = () => {
  openSidebar()
}

async function openSidebar() {
  await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });

  // 关闭弹窗
  if (window && window.close) {
    window.close();
  }
}

</script>

<template>
  <div>
    <button @click="onClick">打开侧栏</button>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
