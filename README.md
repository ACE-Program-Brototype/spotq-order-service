# SpotQ Order Service

The Order Service is a core microservice of the SpotQ platform, responsible for managing the complete order lifecycle. This repository provides a robust, production-ready infrastructure foundation complete with Clean Architecture principles, secure secret management, and full containerization support.

---

## Current Status and Scope

* **Infrastructure Status:** Complete
* **Business Logic:** Pending implementation

### Implemented Features

* Clean Architecture layout (Domain, Application, Infrastructure, Interfaces)
* Node.js 22 and TypeScript with Express.js
* Prisma ORM integrated with PostgreSQL
* Redis and BullMQ infrastructure for background processing
* Pino structured logging
* Swagger (OpenAPI 3) API documentation
* Docker and Docker Compose containerization support
* Infisical integration for secure runtime secret management
* Biome for code linting and formatting
* Husky Git hooks and GitHub Actions CI/CD pipelines

---

## Technology Stack

| Category | Technology |
| --- | --- |
| **Runtime** | Node.js 22+ |
| **Language** | TypeScript |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Queue and Broker** | Redis and BullMQ |
| **Logging** | Pino |
| **API Documentation** | Swagger (OpenAPI 3) |
| **Secret Management** | Infisical |
| **Containerization** | Docker and Docker Compose |
| **Package Manager** | pnpm |
| **Linter / Formatter** | Biome |

---

## Project Structure

```text
src/
├── application/       # Use cases and business rules
├── common/            # Shared utilities and helpers
├── config/            # Environment and application configs
├── domain/            # Enterprise logic and interfaces
├── infrastructure/    # External services (Database, Logger, Queue, Redis)
├── interfaces/        # Controllers, routes, and API presentation
├── app.ts             # Express application setup
└── server.ts          # Server entry point

prisma/                # Database schema and migrations
docker/                # Docker-related assets
.github/               # CI/CD workflows

```

---

## Prerequisites

Ensure the following tools are installed on your local development machine:

* Node.js 22+ and Corepack
* pnpm
* Docker Desktop
* Infisical CLI

---

## Environment Variables

This service uses Infisical for centralized secret management.

Required secrets managed via Infisical:

* `PORT` - Application server port (default: 3002)
* `NODE_ENV` - Runtime environment (development, staging, production)
* `DATABASE_URL` - PostgreSQL connection string
* `REDIS_URL` - Redis connection string

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ACE-Program-Brototype/spotq-order-service.git
cd spotq-order-service

```

### 2. Install Dependencies

```bash
pnpm install

```

### 3. Run Locally (Development)

```bash
pnpm dev

```

---

## Docker Deployment

The application is fully containerized and integrated with Infisical.

1. Configure your Infisical token inside the `docker-compose.yml` file.
2. Build and spin up the container using Docker Compose:
```bash
docker compose up --build -d

```



---

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server with hot-reloading |
| `pnpm build` | Compile TypeScript code to JavaScript (`dist/`) |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run Biome linter checks |
| `pnpm format` | Format codebase using Biome |
| `pnpm prisma:generate` | Generate Prisma Client bindings |
| `pnpm prisma:migrate` | Apply database migrations |
| `pnpm prisma:studio` | Open Prisma Studio database GUI |

---

## API Documentation and Health

* **Swagger UI:** Available at `http://localhost:3002/api/docs` (when running)
* **Health Check:** `GET /health` returns a healthy status payload:
```json
{
  "status": "healthy"
}

```



---

## Development Workflow

1. Create a feature branch branching off from `development`.
2. Implement assigned user stories following conventional commits.
3. Push your branch and open a Pull Request targeting `development`.
4. Complete code review and approvals prior to merging.

---

## License

This project is part of the SpotQ platform and is intended strictly for internal development within the ACE Program / Brototype organization.