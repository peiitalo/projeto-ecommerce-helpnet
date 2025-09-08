---
description: Repository Information Overview
alwaysApply: true
---

# E-commerce HelpNet Project Information

## Summary
An e-commerce platform with a React frontend, Node.js backend, and PostgreSQL database. The project is fully containerized with Docker and includes a complete shopping system with product management, user accounts, and order processing.

## Structure
- **backend/**: Node.js Express API with Prisma ORM
- **frontend/**: React application built with Vite and TailwindCSS
- **docker/**: Docker Compose configurations for development and production
- **scripts/**: Utility scripts for Docker and mobile setup
- **config/**: Configuration files for the project

## Language & Runtime
**Frontend**:
- **Language**: JavaScript/React
- **Version**: React 19.1.1
- **Build System**: Vite 7.1.2
- **Package Manager**: npm

**Backend**:
- **Language**: JavaScript (Node.js)
- **Version**: Node.js 18
- **Framework**: Express 5.1.0
- **ORM**: Prisma 6.15.0
- **Package Manager**: npm

## Dependencies

### Frontend
**Main Dependencies**:
- React 19.1.1
- React Router DOM 7.8.2
- React Icons 5.5.0
- CPF/CNPJ Validator 1.0.3

**Development Dependencies**:
- Vite 7.1.2
- TailwindCSS 3.4.17
- ESLint 9.33.0
- PostCSS 8.5.6

### Backend
**Main Dependencies**:
- Express 5.1.0
- Prisma Client 6.15.0
- bcryptjs 3.0.2
- CORS 2.8.5
- Nodemon 3.1.10 (for development)

**Development Dependencies**:
- Prisma CLI 6.15.0

## Build & Installation

### Frontend
```bash
cd frontend
npm install
npm run dev     # Development server
npm run build   # Production build
```

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev     # Development server
npm start       # Production server
```

## Docker
**Docker Compose**: docker/docker-compose.yml
**Images**:
- Frontend: node:18-alpine
- Backend: node:18-alpine
- Database: postgres:15-alpine (implied from README)

**Configuration**:
- Frontend runs on port 5173
- Backend runs on port 3001
- PostgreSQL runs on port 5432
- All services connected via ecommerce-network

**Run Commands**:
```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up --build -d

# Stop services
docker-compose down
```

## Database
**Type**: PostgreSQL
**Models**:
- Administrador: System administrators
- Categoria: Product categories
- Cliente: Customer information
- Endereco: Address information
- Produto: Product details
- Pedido: Order information
- ItensPedido: Order items
- MetodoPagamento: Payment methods
- PagamentosPedido: Order payments

**Connection**: Managed through Prisma ORM with connection string:
```
postgresql://postgres:postgres123@postgres:5432/projeto_ecommerce
```

## Testing
No specific testing framework identified in the project files.