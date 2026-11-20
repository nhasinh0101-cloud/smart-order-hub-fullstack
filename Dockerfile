FROM node:22-bookworm-slim AS client-build
WORKDIR /app/smart-order-hub-client
COPY smart-order-hub-client/package*.json ./
RUN npm ci
COPY smart-order-hub-client/ ./
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production MONGO_DB_NAME=smart_order_hub
WORKDIR /app/smart-order-hub-server
COPY smart-order-hub-server/package*.json ./
RUN npm ci --omit=dev
COPY smart-order-hub-server/ ./
COPY --from=client-build /app/smart-order-hub-client/dist ../smart-order-hub-client/dist
COPY mongodb/import_from_node.js mongodb/*.json ../mongodb/
USER node
WORKDIR /app
EXPOSE 3000
CMD ["node", "smart-order-hub-server/index.js"]
