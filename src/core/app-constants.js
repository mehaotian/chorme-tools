/**
 * 应用常量定义
 * 统一管理项目中的魔法数字和配置常量
 */

/**
 * 时间相关常量
 */
export const TIME_CONSTANTS = {
  // 基础时间单位（秒）
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  SECONDS_PER_HOUR: 3600,
  
  // 计时器限制
  MAX_TIMER_HOURS: 24,
  MAX_TIMER_MINUTES: 24 * 60, // 1440分钟
  
  // 延迟和间隔
  TIMER_UPDATE_INTERVAL: 1000, // 1秒
  UI_UPDATE_DELAY: 100, // 100毫秒
  RETRY_BASE_DELAY: 100, // 重试基础延迟
};

/**
 * 消息和通信常量
 */
export const MESSAGE_CONSTANTS = {
  // 超时设置
  DEFAULT_TIMEOUT: 5000, // 5秒
  
  // 重试设置
  DEFAULT_RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1秒
  
  // 队列限制
  MAX_QUEUE_SIZE: 100,
};

/**
 * UI相关常量
 */
export const UI_CONSTANTS = {
  // Toast通知
  TOAST_DURATION: 3000, // 3秒
  
  // 动画和过渡
  ANIMATION_DELAY: 100, // 100毫秒
  
  // 图标尺寸
  ICON_SIZE: {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32
  },
  
  // 百分比相关
  FULL_PERCENT: 100,
};

/**
 * 存储相关常量
 */
export const STORAGE_CONSTANTS = {
  // 精度设置
  PERCENTAGE_PRECISION: 100, // 用于四舍五入到小数点后2位
};

/**
 * 验证相关常量
 */
export const VALIDATION_CONSTANTS = {
  // 输入限制
  MAX_HOURS_INPUT: 24,
  MIN_TIMER_VALUE: 0,
};

/**
 * 组合常量（计算得出的常量）
 */
export const COMPUTED_CONSTANTS = {
  // 最大计时器秒数
  MAX_TIMER_SECONDS: TIME_CONSTANTS.MAX_TIMER_MINUTES * TIME_CONSTANTS.SECONDS_PER_MINUTE,
  
  // 一小时的分钟数
  ONE_HOUR_MINUTES: TIME_CONSTANTS.MINUTES_PER_HOUR,
};