FROM node:lts-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-alpine AS runner
WORKDIR /app
COPY --from=builder /app/build ./
COPY --from=builder /app/public ./public
ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL} # Asegúrate de que esta variable esté definida en el entorno de Docker
EXPOSE 3000
CMD ["npm", "start"]