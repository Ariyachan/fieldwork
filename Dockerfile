FROM node:22.18-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html .env.fullstack ./
COPY src ./src
COPY public ./public
RUN npm run build:fullstack

FROM node:22.18-bookworm-slim
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci && npm cache clean --force
COPY server/src ./src
COPY server/seed.json ./seed.json
COPY server/tsconfig.json ./
COPY --from=web /app/dist /app/dist
ENV HOST=0.0.0.0 PORT=4100 NODE_ENV=production
USER node
EXPOSE 4100
CMD ["sh", "-c", "npm run migrate && npm start"]
