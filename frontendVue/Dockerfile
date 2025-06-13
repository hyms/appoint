FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:lts-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
