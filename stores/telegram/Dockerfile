FROM node:22-slim

WORKDIR /app

COPY package.json ./
COPY api-server/ ./api-server/
COPY artifacts/ ./artifacts/
COPY schema.sql ./
COPY static-server.mjs ./
COPY start.sh ./

RUN mkdir -p /tmp/bot-assets && chmod +x start.sh

ENV PORT=3000
EXPOSE 3000

CMD ["node", "--max-old-space-size=512", "api-server/dist/index.mjs"]
