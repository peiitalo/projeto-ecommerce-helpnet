# Dockerfile para o Backend (Node.js + Express + Prisma)
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Instalar Prisma CLI globalmente
RUN npm install -g prisma

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Criar script de inicialização
RUN echo '#!/bin/sh\n\
echo "Aguardando banco de dados..."\n\
sleep 10\n\
echo "Executando migrações..."\n\
npx prisma migrate deploy\n\
echo "Iniciando aplicação..."\n\
npm start' > /app/start.sh

RUN chmod +x /app/start.sh

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["/app/start.sh"]