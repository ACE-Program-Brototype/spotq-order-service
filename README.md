# SpotQ Order Service

The **Order Service** is a backend microservice responsible for managing the complete order lifecycle within the SpotQ platform. It is built using **Node.js**, **TypeScript**, and **Express.js**, following **Clean Architecture** principles to ensure scalability, maintainability, and testability.

---

## Features

This repository currently includes the foundational infrastructure required for development:

* Node.js + Express.js
* TypeScript configuration
* Clean Architecture project structure
* Prisma ORM configuration
* PostgreSQL integration
* Redis & BullMQ configuration
* Pino logger
* Swagger API documentation
* Docker & Docker Compose support
* GitHub Actions CI pipeline
* Biome formatting and linting
* Husky + lint-staged
* Environment variable validation
* Health check endpoint

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
├── infrastructure/        # Database, external services, observability, Redis
│   ├── database/          # Prisma repositories extending PrismaBaseRepository
│   ├── observability/     # Structured Pino logging & Prometheus metrics
│   ├── redis/             # Redis client and connection lifecycle
│   └── services/          # External microservice clients (S2S authenticated)
├── presentation/          # Delivery mechanisms & HTTP transport layer
│   └── http/
│       ├── controllers/   # Express controllers
│       ├── middleware/    # Auth, validation, and error middleware
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

## Tech Stack

| Technology     | Purpose                   |
| -------------- | ------------------------- |
| Node.js 22     | Runtime                   |
| TypeScript     | Programming Language      |
| Express.js     | HTTP Server               |
| Prisma         | ORM                       |
| PostgreSQL     | Database                  |
| Redis          | Caching & Queue Backend   |
| BullMQ         | Background Job Processing |
| Pino           | Structured Logging        |
| Swagger        | API Documentation         |
| Docker         | Containerization          |
| GitHub Actions | Continuous Integration    |
| pnpm           | Package Manager           |
| Biome          | Formatting & Linting      |
| Husky          | Git Hooks                 |
| Infisical      | Secret Management         |

---

## Prerequisites

Ensure the following tools are installed before running the project:

* Node.js 22+
* pnpm
* Docker Desktop
* Git
* Infisical

The service uses managed external infrastructure for:

* PostgreSQL
* Redis

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate into the project:

```bash
cd spotq-order-service
```

Install dependencies:

```bash
pnpm install
```

---

## Environment Variables

Environment variables are managed using **Infisical**.

The application validates the following environment variables:

| Variable       | Description                        | Required |
| -------------- | ---------------------------------- | -------- |
| `NODE_ENV`     | Application environment            | Yes      |
| `PORT`         | Port on which the service runs     | No       |
| `DATABASE_URL` | PostgreSQL database connection URL | Yes      |

The application uses port **3004** by default when `PORT` is not explicitly provided.

> Do not commit secrets or `.env` files to the repository. Use Infisical for environment and secret management.

---

## Running the Application

### Development

Run the service in development mode:

```bash
pnpm dev
```

### Build

Build the TypeScript application:

```bash
pnpm build
```

### Production

Run the compiled application:

```bash
pnpm start
```

---

## Running with Docker

Build the Docker image:

```bash
docker build -t spotq-order-service:dev .
```

Start the service using Docker Compose:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d
```

Stop the service:

```bash
docker compose down
```

The application is exposed on port:

```text
3002
```

---

## API Documentation

Once the application is running, Swagger documentation is available at:

```text
http://localhost:3004/api/docs
```

Swagger provides an interactive interface for exploring and testing the available APIs.

---

## Health Check

Verify the service status using:

```http
GET /health
```

Example response:

```json
{
  "status": "healthy"
}
```

---

## Available Scripts

| Script                 | Description              |
| ---------------------- | ------------------------ |
| `pnpm dev`             | Start development server |
| `pnpm build`           | Compile TypeScript       |
| `pnpm start`           | Run compiled application |
| `pnpm lint`            | Run Biome checks         |
| `pnpm format`          | Format source code       |
| `pnpm test`            | Run tests                |

---

## Continuous Integration

The GitHub Actions CI pipeline verifies the application before changes are merged.

The current pipeline performs:

* Install dependencies using pnpm
* Generate Prisma Client
* Run Biome checks
* Build the application
* Build the Docker image

Pull requests targeting the protected branches must pass the required CI checks before they can be merged.

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
Infrastructure (Prisma Repositories, Redis, External Service Clients)
```

### Architectural Standards & Conventions

#### 1. DTO Standards
- **Request DTOs**: Named using `*DTO` or `*InputDTO` (e.g. `PlaceOrderDTO`, `GetOrderHistoryInputDTO`, `AddCartItemDTO`).
- **Response DTOs**: Standardized on `*ResponseDTO` across all application use cases and mappers (e.g. `OrderHistoryResponseDTO`, `CartResponseDTO`, `CancelOrderResponseDTO`, `PlaceOrderResponseDTO`, `OrdersOverviewResponseDTO`). While generic Clean Architecture terminology sometimes refers to `*OutputDTO`, `*ResponseDTO` is uniformly maintained across the entire order service boundary for API consistency.
- **DTO Placement**: Zero inline DTO or interface declarations in use cases or controllers. All DTOs are located in `src/application/dtos/` and grouped by feature (`cart/`, `orders/`, `external/`).

#### 2. Mapper Standards
- **Feature Grouping**: Application mappers reside in `src/application/mappers/` grouped by feature (`cart/`, `orders/`).
- **Method Conventions**: Mappers provide explicit, purpose-built static methods: `toDTO(...)` for query responses and `toMutationDTO(...)` for command/mutation operations.
- **Zero Forwarding Wrappers**: Redundant alias methods (e.g. `toResponseDto`, `toDto`) are eliminated in favor of direct, standardized mapper calls.

#### 3. Repository Standards
- **Interface Naming**: Repository interfaces reside in `src/domain/repositories/` following the `*.repository.interface.ts` naming convention (e.g. `cart.repository.interface.ts`, `order.repository.interface.ts`).
- **Interface Types**: Interface names are prefixed with `I` (e.g. `ICartRepository`, `IOrderRepository`).
- **Implementations**: Concrete repository implementations reside in `src/infrastructure/database/repositories/`, extend `PrismaBaseRepository`, and map database models into domain entities. Repository interfaces never import Prisma types.

#### 4. Error Handling & Mapping
- **Consolidated Error Modules**: Domain errors reside in `src/domain/errors/` and are organized into aggregate modules (`cart.errors.ts`, `order.errors.ts`) extending `DomainError`.
- **Zero HTTP Coupling in Domain**: Domain errors contain zero HTTP status codes or web framework dependencies.
- **Centralized Error Mapping**: The presentation layer maps domain error codes to HTTP responses using `domain-error-mapper.util.ts` and centralized message constants.

#### 5. HTTP Status Constants
- **Upper Snake Case**: HTTP status codes are referenced using the `HTTP_STATUS` constant object (e.g. `HTTP_STATUS.OK`, `HTTP_STATUS.NOT_FOUND`, `HTTP_STATUS.CREATED`, `HTTP_STATUS.UNAUTHORIZED`) exported from `@shared/constants/http.constants.ts`.
- **Zero Numeric Literals**: Hardcoded numeric status codes (such as 200, 201, 404, 500) are forbidden in controllers, middleware, and services.

---

## Development Workflow

1. Create a feature branch from `development`.
2. Implement the assigned Jira story.
3. Run local linting and build checks.
4. Commit changes using Conventional Commits.
5. Push the feature branch.
6. Create a Pull Request targeting `development`.
7. Ensure the CI pipeline passes.
8. Address review feedback and resolve conversations.
9. Complete cross review and final review.
10. Merge using the repository's protected branch workflow.

---

## Branching Strategy

The repository follows the following branch flow:

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

Pre-production environment used for integration and validation.

### Main

Production branch containing stable and approved code.

Protected branches require Pull Requests, code reviews, successful CI checks, and resolved review conversations before merging.

---

## License

This repository is part of the **SpotQ** project and is intended for internal development and collaboration within the team.
