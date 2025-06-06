/**
 * 常量定义
 * 包含CSS属性配置、预设主题等核心数据
 */

/**
 * CSS属性配置 - 定义可编辑的CSS属性及其类型
 */
export const CSS_PROPERTIES = {
  layout: {
    name: "布局",
    properties: {
      display: {
        name: "显示方式",
        type: "select",
        options: ["block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "none"],
      },
      position: {
        name: "定位",
        type: "select",
        options: ["static", "relative", "absolute", "fixed", "sticky"],
      },
      // Flex容器属性
      "flex-direction": {
        name: "Flex方向",
        type: "select",
        options: ["row", "row-reverse", "column", "column-reverse"],
      },
      "flex-wrap": {
        name: "Flex换行",
        type: "select",
        options: ["nowrap", "wrap", "wrap-reverse"],
      },
      "justify-content": {
        name: "主轴对齐",
        type: "select",
        options: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
      },
      "align-items": {
        name: "交叉轴对齐",
        type: "select",
        options: ["stretch", "flex-start", "flex-end", "center", "baseline"],
      },
      "align-content": {
        name: "多行对齐",
        type: "select",
        options: ["stretch", "flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
      },
      "gap": { name: "间距", type: "text", unit: "px" },
      "row-gap": { name: "行间距", type: "text", unit: "px" },
      "column-gap": { name: "列间距", type: "text", unit: "px" },
      // Flex项目属性
      "flex": { name: "Flex缩放", type: "text", placeholder: "1 1 auto" },
      "flex-grow": { name: "Flex增长", type: "number", min: 0 },
      "flex-shrink": { name: "Flex收缩", type: "number", min: 0 },
      "flex-basis": { name: "Flex基准", type: "text", unit: "px" },
      "align-self": {
        name: "自身对齐",
        type: "select",
        options: ["auto", "stretch", "flex-start", "flex-end", "center", "baseline"],
      },
      "order": { name: "排序", type: "number" },
      width: { name: "宽度", type: "text", unit: "px" },
      height: { name: "高度", type: "text", unit: "px" },
      "min-width": { name: "最小宽度", type: "text", unit: "px" },
      "max-width": { name: "最大宽度", type: "text", unit: "px" },
      "min-height": { name: "最小高度", type: "text", unit: "px" },
      "max-height": { name: "最大高度", type: "text", unit: "px" },
      margin: { name: "外边距", type: "text", unit: "px" },
      padding: { name: "内边距", type: "text", unit: "px" },
      top: { name: "顶部距离", type: "text", unit: "px" },
      left: { name: "左侧距离", type: "text", unit: "px" },
      right: { name: "右侧距离", type: "text", unit: "px" },
      bottom: { name: "底部距离", type: "text", unit: "px" },
      "z-index": { name: "层级", type: "number" },
    },
  },
  appearance: {
    name: "外观",
    properties: {
      "background-color": { name: "背景颜色", type: "color" },
      "background-image": { name: "背景图片", type: "text", placeholder: "url(image.jpg) 或 linear-gradient(...)" },
      "background-size": {
        name: "背景大小",
        type: "combo",
        options: ["auto", "cover", "contain", "100%", "100% 100%", "50%", "200px", "200px 100px"],
      },
      "background-position": { 
        name: "背景位置", 
        type: "combo",
        options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right", "center top", "center bottom"],
      },
      "background-repeat": {
        name: "背景重复",
        type: "combo",
        options: ["repeat", "no-repeat", "repeat-x", "repeat-y", "space", "round"],
      },
      "background-attachment": {
        name: "背景附着",
        type: "combo",
        options: ["scroll", "fixed", "local"],
      },
      "background-clip": {
        name: "背景裁剪",
        type: "combo",
        options: ["border-box", "padding-box", "content-box", "text"],
      },
      "background-origin": {
        name: "背景原点",
        type: "combo",
        options: ["border-box", "padding-box", "content-box"],
      },
      "background-blend-mode": {
        name: "背景混合模式",
        type: "combo",
        options: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"],
      },
      border: { name: "边框", type: "text" },
      "border-radius": { name: "圆角", type: "text", unit: "px" },
      "box-shadow": { name: "阴影", type: "text" },
      opacity: { name: "透明度", type: "range", min: 0, max: 1, step: 0.1 },
    },
  },
  typography: {
    name: "文字",
    properties: {
      color: { name: "文字颜色", type: "color" },
      "font-size": { name: "字体大小", type: "text", unit: "px" },
      "font-weight": {
        name: "字体粗细",
        type: "select",
        options: [
          "normal",
          "bold",
          "100",
          "200",
          "300",
          "400",
          "500",
          "600",
          "700",
          "800",
          "900",
        ],
      },
      "font-family": { name: "字体族", type: "text" },
      "line-height": { name: "行高", type: "text" },
      "text-align": {
        name: "文字对齐",
        type: "select",
        options: ["left", "center", "right", "justify"],
      },
      "text-decoration": {
        name: "文字装饰",
        type: "select",
        options: ["none", "underline", "overline", "line-through"],
      },
      "text-transform": {
        name: "文字转换",
        type: "select",
        options: ["none", "uppercase", "lowercase", "capitalize"],
      },
    },
  },
  effects: {
    name: "特效",
    properties: {
      filter: { name: "滤镜", type: "text" },
      "backdrop-filter": { name: "背景滤镜", type: "text" },
      transform: { name: "变换", type: "text" },
      transition: { name: "过渡", type: "text" },
      animation: { name: "动画", type: "text" },
    },
  },
};

/**
 * CSS属性分组配置 - 为了向后兼容，使用CSS_PROPERTIES的别名
 * @deprecated 请直接使用 CSS_PROPERTIES
 */
export const CSS_PROPERTY_GROUPS = CSS_PROPERTIES;

/**
 * 预设主题配置
 */
export const PRESET_THEMES = [
  {
    id: "none",
    name: "无主题",
    description: "清除所有样式修改",
    groups: [],
    urlPatterns: []
  },
  {
    id: "modern-light",
    name: "现代浅色",
    description: "简洁现代的浅色主题",
    urlPatterns: [
      {
        pattern: "*://linux.do/*",
        type: "wildcard",
        enabled: true
      }
    ],
    groups: [
      {
        id: "body-style",
        name: "页面基础",
        description: "页面整体样式",
        rules: [
          {
            selector: "body",
            properties: {
              "background-color": "#f8fafc",
              "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              "line-height": "1.6",
              color: "#334155"
            }
          }
        ]
      }
    ]
  },
  {
    id: "modern-dark",
    name: "现代深色",
    description: "优雅的深色主题",
    urlPatterns: [
      {
        pattern: "*://linux.do/*",
        type: "wildcard",
        enabled: true
      }
    ],
    groups: [
      {
        id: "body-style",
        name: "页面基础",
        description: "页面整体样式",
        rules: [
          {
            selector: "body",
            properties: {
              "background-color": "#0f172a",
              "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              "line-height": "1.6",
              color: "#e2e8f0"
            }
          }
        ]
      }
    ]
  }
];

/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  // 应用版本
  VERSION: '1.0.0',
  
  // 存储键名
  STORAGE_KEYS: {
    CUSTOM_THEMES: 'customThemes',
    APPLIED_THEME_ID: 'appliedThemeId'
  },
  
  // 验证规则
  VALIDATION: {
    MAX_THEME_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 200,
    MAX_SELECTOR_LENGTH: 500,
    MAX_URL_PATTERN_LENGTH: 200
  },
  
  // UI配置（非通用常量）
  UI: {
    MODAL_ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
  }
};

/**
 * URL匹配模式类型
 */
export const URL_PATTERN_TYPES = {
  WILDCARD: 'wildcard',
  REGEX: 'regex',
  EXACT: 'exact'
};

/**
 * URL匹配工具函数
 */
export const URL_MATCHER = {
  /**
   * 检查URL是否匹配指定模式
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 匹配模式
   * @param {string} type - 模式类型
   * @returns {boolean} 是否匹配
   */
  isMatch(url, pattern, type = URL_PATTERN_TYPES.WILDCARD) {
    if (!url || !pattern) return false;
    
    try {
      switch (type) {
        case URL_PATTERN_TYPES.EXACT:
          return url === pattern;
          
        case URL_PATTERN_TYPES.REGEX:
          const regex = new RegExp(pattern);
          return regex.test(url);
          
        case URL_PATTERN_TYPES.WILDCARD:
        default:
          return this.wildcardMatch(url, pattern);
      }
    } catch (error) {
      console.warn('URL匹配失败:', error);
      return false;
    }
  },
  
  /**
   * 通配符匹配
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 通配符模式
   * @returns {boolean} 是否匹配
   */
  wildcardMatch(url, pattern) {
    if (pattern === '*') return true;
    
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*/g, '.*') // * 转换为 .*
      .replace(/\?/g, '.'); // ? 转换为 .
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  },
  
  /**
   * 从URL中提取域名
   * @param {string} url - 完整URL
   * @returns {string} 域名
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.warn('URL解析失败:', error);
      return '';
    }
  },
  
  /**
   * 验证URL模式的有效性
   * @param {string} pattern - URL模式
   * @param {string} type - 模式类型
   * @returns {boolean} 是否有效
   */
  validatePattern(pattern, type = URL_PATTERN_TYPES.WILDCARD) {
    if (!pattern || typeof pattern !== 'string') return false;
    
    try {
      switch (type) {
        case URL_PATTERN_TYPES.REGEX:
          new RegExp(pattern);
          return true;
          
        case URL_PATTERN_TYPES.EXACT:
          return pattern.length > 0;
          
        case URL_PATTERN_TYPES.WILDCARD:
        default:
          // 基本的通配符模式验证
          return pattern.length > 0 && pattern.length <= 200;
      }
    } catch (error) {
      return false;
    }
  }
};