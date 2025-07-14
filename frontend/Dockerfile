# Multi-stage Docker build for A1Betting Frontend
FROM node:18-alpine as base

# Set environment variables
ENV NODE_ENV=production
ENV VITE_NODE_ENV=production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 -G nodejs

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base as development

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Change ownership to app user
RUN chown -R frontend:nodejs /app
USER frontend

# Expose port
EXPOSE 5173

# Development command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base as builder

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build:no-ts

# Production stage
FROM nginx:1.21-alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Serve stage (alternative to production for development serving)
FROM node:18-alpine as serve

# Install serve globally
RUN npm install -g serve

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 -G nodejs

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=frontend:nodejs /app/dist ./dist

USER frontend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Serve the application
CMD ["serve", "-s", "dist", "-l", "3000"]

# --- Frontend Production Dockerfile ---

# Stage 1: Build the React application
# Use a specific Node.js version for reproducibility
FROM node:18.18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json for dependency caching
COPY package*.json ./

# Install dependencies securely and efficiently
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the production-ready static files
# This command should correspond to the build script in package.json
RUN npm run build


# Stage 2: Serve the application using a lightweight Nginx server
# Use a specific Nginx version for reproducibility
FROM nginx:1.21.6-alpine AS production

# Copy the built static files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration to the correct location
# This ensures our custom config is used instead of the default.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the Nginx web server
EXPOSE 80

# The default command for the nginx image is to start nginx in the foreground.
# CMD ["nginx", "-g", "daemon off;"] is the default and can be omitted for simplicity.
