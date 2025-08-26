# Dockerfile para o Frontend (React + Vite)
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta do Vite
EXPOSE 5173

# Comando para desenvolvimento (com hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]