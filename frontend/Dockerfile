# --- Build stage ---
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* env vars into the JS bundle at build time, so they must
# be passed as build args rather than runtime environment variables.
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_WS_BASE_URL=ws://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
