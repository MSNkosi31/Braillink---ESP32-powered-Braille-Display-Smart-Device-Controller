FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy only package files first — so this layer is cached
COPY package*.json ./

# Use faster mirrors and install deps efficiently
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy rest of the app and build
COPY . .
RUN npm run build

# --- Final lightweight image ---
FROM node:20-slim

WORKDIR /usr/src/app

# Copy only what's needed for runtime
COPY --from=builder /usr/src/app/build ./build
COPY package*.json ./

RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund

EXPOSE 3000
CMD ["npm", "start"]


