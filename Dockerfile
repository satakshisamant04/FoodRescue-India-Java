# Production Multi-Stage Dockerfile for Aahar Setu (Node.js + Vite + Express)

# Step 1: Build the client assets and bundle backend server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig*.json vite.config.ts ./

# Install all dependencies (including devDependencies for esbuild & vite)
RUN npm ci || npm install

# Copy source files
COPY . .

# Build Vite frontend into dist/ and bundle server into dist/server.cjs
RUN npm run build

# Step 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for optional container healthchecks
RUN apk add --no-cache curl

# Copy dependency files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Copy local persistent data folder (with initial seed)
COPY --from=builder /app/data ./data

# Expose server port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
