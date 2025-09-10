---
description: Repository Information Overview
alwaysApply: true
---

# E-commerce HelpNet Project Information

## Summary
Full-stack e-commerce application with React frontend, Node.js backend, and PostgreSQL database. The project is containerized with Docker for easy deployment and development.

## Structure
- **frontend/**: React application built with Vite and TailwindCSS
- **backend/**: Node.js API with Express and Prisma ORM
- **docker/**: Docker configuration files for containerization
- **scripts/**: Utility scripts for Docker and development setup

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
- TailwindCSS 3.4.17

### Backend
**Main Dependencies**:
- Express 5.1.0
- Prisma Client 6.15.0
- bcryptjs 3.0.2
- jsonwebtoken 9.0.2
- cors 2.8.5

## Database
**Type**: PostgreSQL
**Schema**: Prisma schema with models for:
- Customers (Cliente)
- Products (Produto)
- Categories (Categoria)
- Orders (Pedido)
- Addresses (Endereco)
- Payment Methods (MetodoPagamento)

## Build & Installation

### Development Setup
```bash
# Start all services with Docker
docker-compose up --build

# Frontend development
cd frontend
npm install
npm run dev

# Backend development
cd backend
npm install
npm run dev
```

## Docker
**Configuration**: Multi-container setup with docker-compose
**Images**:
- Frontend: node:18-alpine
- Backend: node:18-alpine
- Database: postgres:15-alpine (referenced in README)

**Docker Compose Files**:
- docker/docker-compose.yml: Main configuration
- docker/docker-compose.prod.yml: Production configuration
- docker/docker-compose.mobile.yml: Mobile development configuration

## API Endpoints
- `/api/clientes`: Customer management
- `/api/produtos`: Product management
- `/api/categorias`: Category management
- `/api/vendedor/produtos`: Vendor product management

## Environment Variables
**Backend**:
- DATABASE_URL: PostgreSQL connection string
- PORT: API port (default: 3001)
- SALT_ROUNDS: Password hashing rounds
- NODE_ENV: Environment (development/production)

**Frontend**:
- VITE_API_BASE_URL: Backend API URL