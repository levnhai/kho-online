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
            if (err.code === "ECONNRESET" || err.code === "EPIPE") {
              // Bỏ qua lỗi ngắt kết nối socket bất ngờ khi reload trình duyệt
              return;
            }
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message:
                    err.code === "ECONNREFUSED"
                      ? "Không thể kết nối đến máy chủ Backend (Port 5000 chưa chạy). Vui lòng khởi động backend!"
                      : "Lỗi kết nối máy chủ",
                  code: err.code,
                }),
              );
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
            if (err.code === "ECONNRESET" || err.code === "EPIPE") {
              return;
            }
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Không thể kết nối đến máy chủ tải ảnh (Port 5000)",
                  code: err.code,
                }),
              );
            }
          });
        },
      },
    },
  },
});
