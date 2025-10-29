# syntax=docker/dockerfile:1

# 1) Build the React (Vite) frontend
FROM node:20-bookworm-slim AS frontend
WORKDIR /app

# Workaround Rollup optional native deps issue in containers
ENV ROLLUP_SKIP_NODEJS_NATIVE=1

# Install root dependencies (includes Vite dev deps)
COPY package*.json ./
RUN npm ci || (rm -rf node_modules package-lock.json && npm i)
# Ensure platform-specific rollup binary is available without mutating package.json
RUN npm i -D --no-save @rollup/rollup-linux-x64-gnu

# Copy only frontend sources needed for build
COPY vite.config.js ./
COPY index.html ./
COPY src ./src

# Build production assets to /app/dist
RUN npm run build

# 2) Create the production image with backend + built frontend
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend ./backend

# Copy built frontend into backend/dist (served by Express)
COPY --from=frontend /app/dist ./backend/dist

# Ensure uploads dir exists (ephemeral unless you mount a volume)
RUN mkdir -p ./backend/uploads

EXPOSE 5000
ENV PORT=5000
CMD ["node", "backend/server.js"]
