import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      include: ["lucide-react"],
    },
    server: {
      port: 5174,
      host: "0.0.0.0", // 改为0.0.0.0支持局域网访问
      open: true,
      proxy: {
        "/api": {
          target: env.VITE_PYTHON_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          // 已切换到Python API服务，不重写路径，保持 /api/v1 前缀
          // 可通过环境变量 VITE_PYTHON_API_BASE_URL 配置API地址
          ws: true,
        },
        "/python-api": {
          target: env.VITE_PYTHON_API_BASE_URL || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/python-api/, ""),
          ws: true,
        },
      },
    },
    build: {
      sourcemap: env.VITE_BUILD_SOURCEMAP === "true",
      minify: env.VITE_BUILD_DROP_CONSOLE === "true" ? "terser" : "esbuild",
      terserOptions:
        env.VITE_BUILD_DROP_CONSOLE === "true"
          ? {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            }
          : undefined,
    },
    define: {
      // 确保环境变量在构建时可用
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || "1.0.0"),
      __APP_TITLE__: JSON.stringify(
        env.VITE_APP_TITLE || "智能投资助手平台"
      ),
      __API_PREFIX__: JSON.stringify(env.VITE_API_PREFIX || "/api/v1"),
    },
  };
});
