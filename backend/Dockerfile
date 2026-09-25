# Multi-stage Dockerfile for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm cả NestJS CLI để build)
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Build dự án NestJS ra thư mục dist
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Sao chép package.json và cài đặt chỉ production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Sao chép mã nguồn đã compile từ builder stage
COPY --from=builder /app/dist ./dist

# Tạo thư mục uploads tĩnh nếu cần lưu file tạm
RUN mkdir -p uploads

# Expose cổng Backend chạy (mặc định 5000)
EXPOSE 5000

# Khởi chạy server
CMD ["node", "dist/main.js"]
