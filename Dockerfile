FROM node:24-bookworm-slim

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json .npmrc ./
RUN npm ci --include=dev --include=optional

COPY --chown=node:node . .
RUN npm run build && mkdir -p .wrangler/state

EXPOSE 8787
CMD ["node", "scripts/docker-start.mjs"]
