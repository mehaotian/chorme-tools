# Chrome 扩展消息路由系统

本文档介绍了 Chrome 扩展中全新的智能消息路由系统，支持 popup、content-scripts、侧栏等组件间的高效通信。

## 🚀 系统概述

智能消息路由系统提供了一个**自动识别发送者**的统一消息转发机制，**只需要一个 action** 即可实现组件间通信，大大简化了消息传递的复杂度。

### ✨ 主要特性

- **🎯 智能路由**: 自动识别消息发送者，无需手动指定转发目标
- **📝 简化格式**: 只需要一个 `action: 'message'`，告别复杂的双重 action
- **🔄 自动重试**: 消息发送失败时自动重试机制
- **📬 消息队列**: 离线消息队列，确保消息不丢失
- **🛡️ 错误处理**: 完善的错误捕获和处理机制
- **🔍 消息追踪**: 每条消息都有唯一ID，便于调试和追踪
- **🔗 连接管理**: 自动管理各组件的连接状态
- **⚡ 向后兼容**: 完全兼容原有的消息格式

消息路由系统 (`MessageRouter`) 是一个统一的消息转发中心，负责处理 Chrome 扩展中所有组件间的通信，包括：

- **Popup** ↔ **Content Scripts**
- **Sidebar** ↔ **Content Scripts**
- **Background** ↔ **所有组件**
- **组件间广播通信**

## 🏗️ 系统架构

```base
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Popup     │◄──►│   Background    │◄──►│ Content     │
│   页面      │    │   消息路由器     │    │ Scripts     │
└─────────────┘    └─────────────────┘    └─────────────┘
                           ▲
                           │
                   ┌─────────────┐
                   │   Sidebar   │
                   │   侧栏页面   │
                   └─────────────┘
```

## 📋 消息格式规范

### 🆕 新的简化消息格式（推荐）

使用智能路由，只需要一个统一的 action：

```javascript
{
  action: 'message',     // 统一使用 'message' 或 'send'
  data: {                // 实际的消息内容
    action: string,      // 实际要执行的操作
    payload?: any,       // 操作数据
    // ... 其他数据
  },
  target?: string,       // 可选：明确指定目标（不指定则自动路由）
  messageId?: string,    // 可选：消息ID（系统自动生成）
  timestamp?: number     // 可选：时间戳（系统自动生成）
}
```

### 📤 智能路由规则

系统会自动识别发送者并选择合适的目标：

| 发送者 | 默认目标 | 说明 |
|--------|----------|------|
| Popup | Content Script | Popup 的消息默认发送到当前标签页的 Content Script |
| Content Script | Popup | Content Script 的消息默认发送到 Popup |
| Sidepanel | Content Script | Sidebar 的消息默认发送到当前标签页的 Content Script |
| Background | 根据消息内容 | Background 根据消息类型智能路由 |

### 🔄 向后兼容的消息格式

原有的消息格式仍然支持：

```javascript
{
  action: 'string',        // 必需：消息动作类型
  messageId: 'string',     // 可选：消息ID（系统自动生成）
  target: 'string',        // 可选：目标组件
  data: {},               // 可选：消息数据
  timestamp: number       // 可选：时间戳（系统自动添加）
}
```

### 支持的消息动作类型

| Action | 描述 | 用途 |
|--------|------|------|
| `message` / `send` | 智能路由消息 | 自动识别发送者并路由到合适目标 |
| `forwardToContentScript` | 转发到内容脚本 | Popup/Sidebar → Content Script |
| `forwardToPopup` | 转发到弹窗页面 | Content Script → Popup |
| `forwardToSidePanel` | 转发到侧栏页面 | Content Script → Sidebar |
| `broadcast` | 广播消息 | 向所有组件发送消息 |
| `pageBeautify` | 页面美化 | 页面样式相关操作 |
| `storage` | 存储操作 | Chrome 存储 API 操作 |
| `tabs` | 标签页操作 | Chrome 标签页 API 操作 |
| `system` | 系统消息 | 系统级操作和查询 |

## 🚀 使用方法

### 🆕 新的简化用法（推荐）

#### Popup 到 Content Script（自动路由）

```javascript
// 在 popup 中发送消息 - 系统自动识别并路由到 content script
const response = await chrome.runtime.sendMessage({
  action: 'message',  // 统一的 action
  data: {
    action: 'pageBeautify.applyTheme',
    theme: 'dark',
    options: {
      animation: true,
      duration: 300
    }
  }
  // 无需指定 target，系统自动识别 popup 并路由到 content script
});

if (response.success) {
  console.log('主题应用成功:', response.data);
} else {
  console.error('主题应用失败:', response.error);
}
```

#### Content Script 到 Popup（自动路由）

```javascript
// 在 content script 中发送消息 - 系统自动识别并路由到 popup
const response = await chrome.runtime.sendMessage({
  action: 'message',  // 统一的 action
  data: {
    action: 'pageAnalyzed',
    payload: {
      title: document.title,
      url: window.location.href,
      elementCount: document.querySelectorAll('*').length
    }
  }
  // 无需指定 target，系统自动识别 content script 并路由到 popup
});
```

#### 明确指定目标（可选）

```javascript
// 如果需要明确指定目标，可以使用 target 参数
const response = await chrome.runtime.sendMessage({
  action: 'message',
  target: 'sidepanel',  // 明确指定发送到侧栏
  data: {
    action: 'updateSidebar',
    payload: {
      message: 'Hello Sidebar!',
      timestamp: Date.now()
    }
  }
});
```

### 🔄 原有用法（向后兼容）

#### 1. 从 Popup 发送消息到 Content Script

```javascript
// popup.js - 原有的复杂格式仍然支持
const message = {
  action: 'forwardToContentScript',
  data: {
    action: 'applyTheme',
    theme: 'dark',
    selector: '.content'
  }
};

chrome.runtime.sendMessage(message, (response) => {
  if (response.success) {
    console.log('消息发送成功:', response);
  } else {
    console.error('消息发送失败:', response.error);
  }
});
```

#### 2. 从 Content Script 发送消息到 Popup

```javascript
// content-script.js
const message = {
  action: 'forwardToPopup',
  data: {
    action: 'updateStatus',
    status: 'theme-applied',
    details: { selector: '.content', theme: 'dark' }
  }
};

chrome.runtime.sendMessage(message, (response) => {
  if (response.success) {
    console.log('消息已转发到 Popup');
  }
});
```

#### 3. 广播消息到所有组件

```javascript
// 任意组件
const broadcastMessage = {
  action: 'broadcast',
  data: {
    action: 'themeChanged',
    newTheme: 'dark',
    timestamp: Date.now()
  },
  excludeSender: true  // 排除发送者自己
};

chrome.runtime.sendMessage(broadcastMessage, (response) => {
  console.log('广播结果:', response.results);
});
```

## 🎯 使用 ChromeApiService（推荐）

为了进一步简化使用，推荐使用封装好的 `ChromeApiService`：

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

// 发送自定义消息
await chromeApi.sendMessage({
  action: 'customAction',
  data: { key: 'value' }
}, 'sidepanel'); // 可选指定目标
```

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

## 🔧 高级功能

### 1. 存储操作

```javascript
// 保存数据
const saveMessage = {
  action: 'storage',
  type: 'set',
  data: {
    items: {
      userTheme: 'dark',
      lastUpdate: Date.now()
    }
  }
};

chrome.runtime.sendMessage(saveMessage, (response) => {
  if (response.success) {
    console.log('数据保存成功');
  }
});

// 获取数据
const getMessage = {
  action: 'storage',
  type: 'get',
  data: {
    keys: ['userTheme', 'lastUpdate']
  }
};

chrome.runtime.sendMessage(getMessage, (response) => {
  if (response.success) {
    console.log('获取的数据:', response.data);
  }
});
```

### 2. 标签页操作

```javascript
// 查询标签页
const queryMessage = {
  action: 'tabs',
  type: 'query',
  data: {
    queryInfo: { active: true, currentWindow: true }
  }
};

chrome.runtime.sendMessage(queryMessage, (response) => {
  if (response.success) {
    console.log('当前活动标签页:', response.data);
  }
});

// 刷新标签页
const reloadMessage = {
  action: 'tabs',
  type: 'reload',
  data: {
    tabId: 123,
    reloadProperties: { bypassCache: true }
  }
};

chrome.runtime.sendMessage(reloadMessage);
```

### 3. 系统消息

```javascript
// Ping 测试
const pingMessage = {
  action: 'system',
  type: 'ping'
};

chrome.runtime.sendMessage(pingMessage, (response) => {
  console.log('Pong:', response.data.pong);
});

// 获取扩展信息
const infoMessage = {
  action: 'system',
  type: 'getExtensionInfo'
};

chrome.runtime.sendMessage(infoMessage, (response) => {
  console.log('扩展信息:', response.data);
});

// 获取消息队列（用于 Popup/Sidebar）
const queueMessage = {
  action: 'system',
  type: 'getMessageQueue',
  data: {
    target: 'popup'  // 或 'sidepanel'
  }
};

chrome.runtime.sendMessage(queueMessage, (response) => {
  const messages = response.data.messages;
  console.log('待处理消息:', messages);
});
```

### 4. 消息队列机制

由于 Popup 和 Sidebar 页面可能不总是活跃状态，系统提供了消息队列机制：

```javascript
// 在 Popup 或 Sidebar 初始化时获取待处理消息
window.addEventListener('load', async () => {
  const queueMessage = {
    action: 'system',
    type: 'getMessageQueue',
    data: { target: 'popup' }
  };
  
  const response = await chrome.runtime.sendMessage(queueMessage);
  const pendingMessages = response.data.messages;
  
  // 处理待处理的消息
  pendingMessages.forEach(message => {
    handleIncomingMessage(message);
  });
});
```

## 🛠️ 调试和监控

### 1. 控制台日志

系统会在 Background Script 的控制台中输出详细的日志信息：

```base
📡 消息路由器已初始化
📋 [2024-01-01T12:00:00.000Z] RECEIVED: {
  messageId: "msg_1704110400000_abc123",
  action: "message",
  sender: { ... }
}
🎯 智能路由: popup -> content
📋 [2024-01-01T12:00:00.100Z] RESPONSE: {
  success: true,
  target: "content-script",
  tabId: 123
}
```

### 2. 开发者工具

1. 打开 Chrome 扩展管理页面
2. 找到你的扩展，点击「检查视图」→「背景页」
3. 在控制台中查看消息路由日志

### 3. 错误处理

```javascript
function sendMessageWithErrorHandling(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (!response.success) {
        reject(new Error(response.error));
        return;
      }
      
      resolve(response);
    });
  });
}

// 使用示例
try {
  const response = await sendMessageWithErrorHandling({
    action: 'message',
    data: { action: 'test' }
  });
  console.log('成功:', response);
} catch (error) {
  console.error('失败:', error.message);
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

## 📝 最佳实践

### 1. 消息命名规范

```javascript
// ✅ 好的命名
{
  action: 'message',
  data: {
    action: 'pageBeautify.applyTheme',
    theme: 'dark'
  }
}

// ❌ 避免的命名
{
  action: 'send',
  data: { do: 'theme' }
}
```

### 2. 错误处理

```javascript
// ✅ 完整的错误处理
chrome.runtime.sendMessage(message, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Runtime error:', chrome.runtime.lastError);
    return;
  }
  
  if (!response || !response.success) {
    console.error('Message failed:', response?.error);
    return;
  }
  
  // 处理成功响应
  handleSuccess(response);
});
```

### 3. 消息数据结构

```javascript
// ✅ 结构化的数据
{
  action: 'message',
  data: {
    action: 'ui.updateElement',
    payload: {
      selector: '.target-element',
      properties: {
        style: { color: 'red' },
        attributes: { 'data-theme': 'dark' }
      }
    },
    options: {
      animate: true,
      duration: 300
    }
  }
}
```

### 4. 性能优化

```javascript
// ✅ 批量操作
const batchMessage = {
  action: 'message',
  data: {
    action: 'ui.batchUpdate',
    operations: [
      { selector: '.elem1', style: { color: 'red' } },
      { selector: '.elem2', style: { color: 'blue' } }
    ]
  }
};

// ❌ 避免频繁的单个操作
// 不要在循环中发送多个消息
```

## 🔍 故障排除

### 常见问题

1. **消息发送失败**
   - 检查 `chrome.runtime.lastError`
   - 确认目标组件已加载
   - 验证消息格式

2. **Content Script 未响应**
   - 检查 Content Script 是否已注入
   - 系统会自动尝试注入并重试

3. **Popup 消息丢失**
   - 使用消息队列机制
   - 在 Popup 打开时主动获取待处理消息

### 调试技巧

```javascript
// 启用详细日志
const debugMessage = {
  action: 'system',
  type: 'ping',
  debug: true
};

// 检查系统状态
chrome.runtime.sendMessage({
  action: 'system',
  type: 'getExtensionInfo'
}, (response) => {
  console.log('系统状态:', response);
});
```

## 🔒 安全注意事项

1. **消息验证**：系统会自动验证消息格式和来源
2. **权限检查**：确保发送者有权限执行请求的操作
3. **数据清理**：自动清理和验证消息数据
4. **错误隔离**：错误不会影响其他消息的处理

## 📚 API 参考

### MessageRouter 类

#### 主要方法

- `handleMessage(message, sender, sendResponse)` - 处理消息的主入口
- `validateMessage(message, sender)` - 验证消息格式
- `routeMessage(message, sender, sendResponse)` - 路由消息到目标
- `smartRoute(message, sender)` - 智能路由（自动识别发送者）
- `forwardToContentScript(message, sender)` - 转发到内容脚本
- `forwardToPopup(message, sender)` - 转发到弹窗
- `forwardToSidePanel(message, sender)` - 转发到侧栏
- `broadcastMessage(message, sender)` - 广播消息

#### 配置选项

```javascript
const router = new MessageRouter();
router.retryCount = 3;        // 重试次数
router.retryDelay = 1000;     // 重试延迟（毫秒）
```

## 🎉 总结

新的简化消息系统具有以下优势：

✅ **简单易用**：只需要一个统一的 action  
✅ **智能路由**：自动识别发送者和目标  
✅ **向后兼容**：现有代码无需修改  
✅ **错误处理**：完善的错误处理和重试机制  
✅ **性能优化**：支持消息缓存和批量操作  
✅ **安全可靠**：内置消息验证和权限检查  
✅ **消息队列**：支持离线消息队列，确保消息不丢失  
✅ **调试友好**：详细的日志记录和错误追踪  

通过这个简化的消息系统，你可以更轻松地管理 Chrome 扩展中的消息传递，专注于业务逻辑的实现。

---

## 📄 相关文档

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
