import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err: any, _req: any, res: any) => {
            if (err.code === "ECONNRESET" || err.code === "EPIPE" || err.code === "ECONNREFUSED") {
              // Bỏ qua lỗi ngắt kết nối socket bất ngờ khi reload trình duyệt hoặc backend restart
              return;
            }
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Proxy connection error", code: err.code }));
            }
          });
        },
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err: any, _req: any, res: any) => {
            if (err.code === "ECONNRESET" || err.code === "EPIPE" || err.code === "ECONNREFUSED") {
              return;
            }
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Proxy connection error", code: err.code }));
            }
          });
        },
      },
    },
  },
});
