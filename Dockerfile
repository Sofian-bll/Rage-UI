# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the backend and serve
FROM oven/bun:1.1-alpine
WORKDIR /app/backend

# Install required system dependencies: git, openssh, curl, and sops
RUN apk add --no-cache git openssh curl && \
    curl -LO https://github.com/getsops/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64 && \
    mv sops-v3.8.1.linux.amd64 /usr/local/bin/sops && \
    chmod +x /usr/local/bin/sops

# Setup SSH for GitOps (GitHub & GitLab)
RUN mkdir -p /root/.ssh && \
    chmod 700 /root/.ssh && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts && \
    ssh-keyscan gitlab.com >> /root/.ssh/known_hosts && \
    chmod 644 /root/.ssh/known_hosts

# Copy backend dependencies
COPY backend/package.json backend/bun.lock ./
RUN bun install --production

# Copy backend source
COPY backend/ .

# Copy built frontend to the expected path
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the API and UI port
EXPOSE 3000

# Start the Bun backend
CMD ["bun", "run", "server.ts"]
