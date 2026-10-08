# ==========================================
# Etapa 1: Construcción (Build)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias para compilar
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar proyecto NestJS
RUN npm run build

# Remover dependencias de desarrollo para aligerar la imagen
RUN npm prune --production

# ==========================================
# Etapa 2: Imagen final para Producción
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar dependencias de producción y código compilado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Puerto expuesto por el backend NestJS
EXPOSE 4000

# Iniciar servidor
CMD ["node", "dist/main"]
