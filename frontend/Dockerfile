FROM node:lts-alpine

RUN apk add --no-cache pnpm git

WORKDIR /app

COPY package*.json ./

RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host"]
