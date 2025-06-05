import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

/**
 * Vite 配置文件
 * 支持 Chrome 扩展开发和端口自动递增
 */
export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  server: {
    // 端口配置 - 如果被占用会自动递增
    port: 3000,
    // 当端口被占用时自动尝试下一个端口
    strictPort: false,
    // 自动打开浏览器
    open: false,
    // 主机配置
    host: true,
    // CORS 配置
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["*"],
    },
    // 响应头配置
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
});
