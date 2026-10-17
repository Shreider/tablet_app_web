FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm ci

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm run start"]
