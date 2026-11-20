# SpotQ Order Service

The **Order Service** is a backend microservice responsible for managing the complete order lifecycle within the SpotQ platform. It is built using **Node.js**, **TypeScript**, and **Express.js**, following **Clean Architecture** principles to ensure scalability, maintainability, and testability.

---

## Current Status and Scope

* **Infrastructure Status:** Complete
* **Business Logic:** Implemented

### Implemented Features

* Clean Architecture layout (Domain, Application, Infrastructure, Presentation)
* Node.js 22 and TypeScript with Express.js
* Prisma ORM integrated with PostgreSQL
* Redis and BullMQ infrastructure for background processing
* RabbitMQ message broker for asynchronous event-driven communication
* Standardized universal structured JSON logging (Pino)
* Prometheus metrics and health monitoring
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
| **Queue and Broker** | Redis, BullMQ, RabbitMQ |
| **Logging** | Structured JSON Logging (Pino) |
| **API Documentation** | Swagger (OpenAPI 3) |
| **Secret Management** | Infisical |
| **Containerization** | Docker and Docker Compose |
| **Package Manager** | pnpm |
| **Linter / Formatter** | Biome |

---

## Project Structure

```text
src/
├── application/           # Use cases, ports, DTOs, mappers
│   ├── dtos/              # Request & Response DTOs grouped by feature
│   │   ├── cart/
│   │   ├── external/
│   │   └── orders/
│   ├── mappers/           # Application mappers grouped by feature
│   │   ├── cart/
│   │   └── orders/
│   ├── ports/             # Port interfaces (use-cases/, external/)
│   └── use-cases/         # Injectable use case implementations
├── config/                # Inversify DI container & environment configuration
├── domain/                # Enterprise business rules, entities, repository interfaces
│   ├── constants/         # Domain constants
│   ├── entities/          # Pure domain entities (Cart, Order, OrderItem)
│   ├── errors/            # Consolidated error modules (cart.errors.ts, order.errors.ts)
│   ├── repositories/      # Repository interfaces (*.repository.interface.ts)
│   └── types/             # Domain entity and aggregate types
├── infrastructure/        # Database, external services, observability, Redis, RabbitMQ
│   ├── database/          # Prisma repositories extending PrismaBaseRepository
│   ├── messaging/         # RabbitMQ consumers & event handlers
│   ├── observability/     # Structured JSON logging & Prometheus metrics
│   ├── rabbitmq/          # RabbitMQ connection and client service
│   ├── redis/             # Redis client and connection lifecycle
│   └── services/          # External microservice clients (S2S authenticated)
├── presentation/          # Delivery mechanisms & HTTP transport layer
│   └── http/
│       ├── controllers/   # Express controllers
│       ├── middleware/    # Auth, validation, logging, and error middleware
│       ├── routes/        # Express REST API routes
│       └── validators/    # Zod request validation schemas
└── shared/                # Cross-cutting constants, responses, errors, utils
    ├── constants/         # HTTP_STATUS, messages, limits, route paths
    ├── errors/            # Base AppError classes
    ├── responses/         # Standard ApiResponse envelope
    └── utils/             # Domain error to HTTP status mapper

prisma/
├── migrations/
└── schema.prisma

.github/
└── workflows/
```

---

## Prerequisites

Ensure the following tools are installed on your local development machine:

* Node.js 22+
* pnpm (v11+)
* Docker Desktop
* Git
* Infisical CLI

The service uses managed external infrastructure for:

* PostgreSQL
* Redis
* RabbitMQ

---

## Environment Variables

This service uses **Infisical** for centralized secret management.

The application validates the following key environment variables:

| Variable | Description | Default | Required |
| --- | --- | --- | --- |
| `NODE_ENV` | Application environment (`development`, `staging`, `production`) | `development` | Yes |
| `PORT` | Port on which the service runs | `3002` | No |
| `DATABASE_URL` | PostgreSQL database connection URL | - | Yes |
| `REDIS_URL` | Redis connection URL | - | Yes |
| `RABBITMQ_URL` | RabbitMQ broker connection URL | - | Yes |
| `SERVICE_NAME` | Service identifier | `order-service` | No |

> Do not commit secrets or `.env` files to the repository. Use Infisical for environment and secret management.

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

### 3. Generate Prisma Client

```bash
pnpm prisma:generate
```

### 4. Run Locally (Development)

```bash
pnpm dev
```

---

## Docker Deployment

The application is fully containerized with Docker and Docker Compose support.

1. Build and spin up the container using Docker Compose:

```bash
docker compose up --build -d
```

2. Stop the service:

```bash
docker compose down
```

The application is exposed on port `3002`.

---

## API Documentation and Health Check

* **Swagger UI:** Available at `http://localhost:3002/api/docs` (when running)
* **Health Check:** `GET /health` returns:

```json
{
  "status": "healthy"
}
```

* **Metrics:** Prometheus metrics available at `GET /metrics`.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development server with hot-reloading |
| `pnpm build` | Compile TypeScript code to JavaScript (`dist/`) using tsup |
| `pnpm start` | Run compiled application |
| `pnpm lint` | Run Biome linter checks |
| `pnpm format` | Format codebase using Biome |
| `pnpm typecheck` | Run Prisma generation and TypeScript compiler typecheck |
| `pnpm test` | Run unit test suite |
| `pnpm prisma:generate` | Generate Prisma Client bindings |
| `pnpm prisma:migrate` | Apply database migrations |
| `pnpm prisma:studio` | Open Prisma Studio database GUI |

---

## Architecture

This service strictly adheres to **Clean Architecture** and **Domain-Driven Design (DDD)** principles, enforcing unidirectional dependency flow from presentation down to domain.

```text
Presentation (HTTP, Controllers, Routes, Validators)
        │
        ▼
Application (Use Cases, Ports, DTOs, Mappers)
        │
        ▼
Domain (Entities, Value Objects, Repository Interfaces, Domain Errors)
        ▲
        │
Infrastructure (Prisma Repositories, Redis, External Service Clients, RabbitMQ)
```

### Architectural Standards & Conventions

#### 1. DTO Standards
- **Request DTOs**: Named using `*DTO` or `*InputDTO` (e.g. `PlaceOrderDTO`, `GetOrderHistoryInputDTO`, `AddCartItemDTO`).
- **Response DTOs**: Standardized on `*ResponseDTO` across all application use cases and mappers (e.g. `OrderHistoryResponseDTO`, `CartResponseDTO`, `CancelOrderResponseDTO`, `PlaceOrderResponseDTO`, `OrdersOverviewResponseDTO`).
- **DTO Placement**: Zero inline DTO or interface declarations in use cases or controllers. All DTOs are located in `src/application/dtos/` and grouped by feature (`cart/`, `orders/`, `external/`).

#### 2. Mapper Standards
- **Feature Grouping**: Application mappers reside in `src/application/mappers/` grouped by feature (`cart/`, `orders/`).
- **Method Conventions**: Mappers provide explicit, purpose-built static methods: `toDTO(...)` for query responses and `toMutationDTO(...)` for command/mutation operations.
- **Zero Forwarding Wrappers**: Redundant alias methods are eliminated in favor of direct, standardized mapper calls.

#### 3. Repository Standards
- **Interface Naming**: Repository interfaces reside in `src/domain/repositories/` following the `*.repository.interface.ts` naming convention (e.g. `cart.repository.interface.ts`, `order.repository.interface.ts`).
- **Interface Types**: Interface names are prefixed with `I` (e.g. `ICartRepository`, `IOrderRepository`).
- **Implementations**: Concrete repository implementations reside in `src/infrastructure/database/repositories/`, extend `PrismaBaseRepository`, and map database models into domain entities. Repository interfaces never import Prisma types.

#### 4. Error Handling & Mapping
- **Consolidated Error Modules**: Domain errors reside in `src/domain/errors/` and are organized into aggregate modules (`cart.errors.ts`, `order.errors.ts`) extending `DomainError`.
- **Zero HTTP Coupling in Domain**: Domain errors contain zero HTTP status codes or web framework dependencies.
- **Centralized Error Mapping**: The presentation layer maps domain error codes to HTTP responses using `domain-error-mapper.util.ts` and centralized message constants.

#### 5. HTTP Status Constants
- **Upper Snake Case**: HTTP status codes are referenced using the `HttpStatus` constant object exported from `@shared/constants/http.constants.ts`.
- **Zero Numeric Literals**: Hardcoded numeric status codes (such as 200, 201, 404, 500) are forbidden in controllers, middleware, and services.

---

## Development Workflow

1. Create a feature branch branching off from `development`.
2. Implement the assigned user story following Conventional Commits.
3. Run local linting, typechecking, and test checks.
4. Push your branch and open a Pull Request targeting `development`.
5. Ensure CI pipeline passes and address code review feedback.
6. Merge into `development` using the protected branch workflow.

---

## Branching Strategy

The repository follows the branch flow below:

```text
feature/*
    │
    ▼
development
    │
    ▼
staging
    │
    ▼
main
```

### Development
Integration branch for active feature development and team collaboration.

### Staging
Pre-production environment used for staging integration and validation.

### Main
Production branch containing stable, approved, and released code.

Protected branches require Pull Requests, code reviews, successful CI checks, and resolved review conversations before merging.

---

## License

This project is part of the SpotQ platform and is intended strictly for internal development within the ACE Program / Brototype organization.
