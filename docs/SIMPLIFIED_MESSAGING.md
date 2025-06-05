# Chrome 扩展简化消息系统使用指南

## 🎯 简化目标

原来的消息传递机制过于复杂，需要两个 action 来区分消息来源和目标，现在通过智能路由系统，只需要一个统一的 action 即可实现消息传递。

## 📋 对比总结

### 旧格式（复杂）

```javascript
// 需要记住多个转发 action
chrome.runtime.sendMessage({
  action: 'forwardToContentScript',  // 第一个 action：指定转发目标
  data: {
    action: 'pageBeautify.applyTheme', // 第二个 action：实际操作
    theme: 'dark'
  }
});
```

### 新格式（简化）

```javascript
// 只需要一个统一的 action，系统自动路由
chrome.runtime.sendMessage({
  action: 'message',                 // 统一的 action
  data: {
    action: 'pageBeautify.applyTheme', // 实际操作
    theme: 'dark'
  }
  // 系统自动识别发送者并路由到正确的目标
});
```

## 🚀 快速开始

### 1. 使用 ChromeApiService（推荐）

```javascript
import { chromeApi } from './src/services/chrome-api.js';

// 应用主题（自动路由到 Content Script）
await chromeApi.applyTheme({
  name: 'dark',
  colors: { background: '#1a1a1a' }
});

// 清除样式
await chromeApi.clearStyles();

// 预览样式
await chromeApi.previewStyle('.header', 'background-color', '#333');
```

### 2. 直接使用消息 API

```javascript
// 新的简化格式
function sendMessage(data, target = null) {
  const message = {
    action: 'message',
    data: data,
    target: target,  // 可选：明确指定目标
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
```

## 🎯 智能路由规则

系统会根据发送者自动选择目标：

| 发送者 | 默认目标 | 说明 |
|--------|----------|------|
| Popup | Content Script | Popup 的消息默认发送到当前标签页的 Content Script |
| Content Script | Popup | Content Script 的消息默认发送到 Popup |
| Sidebar | Content Script | Sidebar 的消息默认发送到当前标签页的 Content Script |
| Background | 根据消息内容 | Background 根据消息类型智能路由 |

## 📝 使用示例

### Popup 页面

```javascript
// popup.js
import { chromeApi } from '../services/chrome-api.js';

class PopupController {
  async applyDarkTheme() {
    try {
      // 自动路由到 Content Script
      const result = await chromeApi.applyTheme({
        name: 'dark',
        colors: {
          background: '#1a1a1a',
          text: '#ffffff'
        }
      });
      
      if (result) {
        console.log('✅ 主题应用成功');
      }
    } catch (error) {
      console.error('❌ 主题应用失败:', error);
    }
  }
  
  async sendToSidebar() {
    try {
      // 明确指定目标为侧栏
      const result = await chromeApi.sendMessage({
        action: 'updateSidebar',
        data: { message: 'Hello from Popup' }
      }, 'sidepanel');
      
      console.log('✅ 消息发送到侧栏成功:', result);
    } catch (error) {
      console.error('❌ 消息发送失败:', error);
    }
  }
}
```

### Content Script

```javascript
// content-script.js
import { chromeApi } from '../services/chrome-api.js';

class ContentController {
  async sendAnalysisResult() {
    try {
      // 自动路由到 Popup
      const result = await chromeApi.sendMessage({
        action: 'pageAnalyzed',
        payload: {
          title: document.title,
          url: window.location.href,
          elementCount: document.querySelectorAll('*').length
        }
      });
      
      console.log('✅ 分析结果发送成功:', result);
    } catch (error) {
      console.error('❌ 分析结果发送失败:', error);
    }
  }
  
  async broadcastUpdate() {
    try {
      // 广播消息到所有组件
      const result = await chromeApi.sendMessage({
        action: 'pageUpdated',
        payload: { timestamp: Date.now() }
      }, 'broadcast');
      
      console.log('✅ 广播消息发送成功:', result);
    } catch (error) {
      console.error('❌ 广播消息发送失败:', error);
    }
  }
}
```

### Sidebar 页面

```javascript
// sidebar.js
import { chromeApi } from '../services/chrome-api.js';

class SidebarController {
  async requestPageInfo() {
    try {
      // 自动路由到 Content Script
      const result = await chromeApi.sendMessage({
        action: 'getPageInfo',
        fields: ['title', 'url', 'description']
      });
      
      console.log('✅ 页面信息获取成功:', result);
      this.updateUI(result.data);
    } catch (error) {
      console.error('❌ 页面信息获取失败:', error);
    }
  }
  
  updateUI(pageInfo) {
    // 更新侧栏 UI
    document.getElementById('page-title').textContent = pageInfo.title;
    document.getElementById('page-url').textContent = pageInfo.url;
  }
}
```

## 🔄 向后兼容

系统完全向后兼容旧格式，现有代码无需修改：

```javascript
// 旧格式仍然可以正常工作
chrome.runtime.sendMessage({
  action: 'forwardToContentScript',
  data: {
    action: 'pageBeautify.applyTheme',
    theme: 'dark'
  }
});

// 新格式（推荐）
chrome.runtime.sendMessage({
  action: 'message',
  data: {
    action: 'pageBeautify.applyTheme',
    theme: 'dark'
  }
});
```

## 🎨 支持的页面美化操作

所有页面美化操作都已简化：

```javascript
// 应用主题
await chromeApi.applyTheme({ name: 'dark' });

// 清除样式
await chromeApi.clearStyles();

// 重置样式
await chromeApi.resetStyles();

// 预览样式
await chromeApi.previewStyle('.header', 'background-color', '#333');

// 清除预览
await chromeApi.clearAllPreview();

// 应用自定义样式
await chromeApi.applyStyles('body { background: #000; }', 'custom-dark');

// 清除选择器高亮
await chromeApi.clearSelectorHighlight();

// 验证选择器
const validation = await chromeApi.validateSelector('.header');
console.log('选择器有效:', validation.isValid);
console.log('匹配元素数量:', validation.elementCount);
```

## 🛠️ 调试和监控

### 1. 控制台日志

```javascript
// 在 background.js 中查看路由日志
console.log('[MessageRouter] 智能路由:', {
  sender: 'popup',
  target: 'content',
  action: 'pageBeautify.applyTheme'
});
```

### 2. 开发者工具

- 打开 Chrome 扩展管理页面
- 点击「检查视图」查看 background script 控制台
- 查看消息路由和处理日志

### 3. 错误处理

```javascript
try {
  const result = await chromeApi.sendMessage(data);
  console.log('✅ 消息发送成功:', result);
} catch (error) {
  console.error('❌ 消息发送失败:', error.message);
  
  // 根据错误类型进行处理
  if (error.message.includes('超时')) {
    // 处理超时错误
  } else if (error.message.includes('连接')) {
    // 处理连接错误
  }
}
```

## 📊 性能优化

### 1. 消息缓存

```javascript
// 避免重复发送相同的消息
const messageCache = new Map();

function sendMessageWithCache(data, target = null) {
  const key = JSON.stringify({ data, target });
  
  if (messageCache.has(key)) {
    return messageCache.get(key);
  }
  
  const promise = chromeApi.sendMessage(data, target);
  messageCache.set(key, promise);
  
  // 5秒后清除缓存
  setTimeout(() => messageCache.delete(key), 5000);
  
  return promise;
}
```

### 2. 批量操作

```javascript
// 批量应用样式
const styleOperations = [
  { action: 'pageBeautify.applyTheme', theme: 'dark' },
  { action: 'pageBeautify.clearStyles' },
  { action: 'pageBeautify.applyStyles', css: 'body { margin: 0; }' }
];

// 并行执行
const results = await Promise.all(
  styleOperations.map(op => chromeApi.sendMessage(op))
);
```

## 🔒 安全注意事项

1. **消息验证**：系统会自动验证消息格式和来源
2. **权限检查**：确保发送者有权限执行请求的操作
3. **数据清理**：自动清理和验证消息数据
4. **错误隔离**：错误不会影响其他消息的处理

## 📚 更多资源

- [完整 API 文档](./MESSAGE_ROUTING.md)
- [使用示例](./examples/smart-routing-examples.js)
- [消息格式对比](./examples/message-format-comparison.js)
- [测试脚本](./test-message-routing.js)

---

## 🎉 总结

新的简化消息系统具有以下优势：

✅ **简单易用**：只需要一个统一的 action  
✅ **智能路由**：自动识别发送者和目标  
✅ **向后兼容**：现有代码无需修改  
✅ **错误处理**：完善的错误处理和重试机制  
✅ **性能优化**：支持消息缓存和批量操作  
✅ **安全可靠**：内置消息验证和权限检查  

通过这个简化的消息系统，你可以更轻松地管理 Chrome 扩展中的消息传递，专注于业务逻辑的实现。
