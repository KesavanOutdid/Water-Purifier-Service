# Base Node image
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production

# Final runtime stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5001

WORKDIR /app

# Copy production dependencies and source code
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Create directory for winston logs
RUN mkdir -p logs

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api-docs || exit 1

CMD ["node", "index.js"]
