# Dockerfile para o Backend (Node.js + Express + Prisma)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copiar código fonte
COPY . .

# Gerar cliente Prisma (já que usa Supabase, apenas gera os tipos)
RUN npx prisma generate

EXPOSE 3001

# Rodar em modo dev (hot reload)
CMD ["npm", "run", "dev"]
