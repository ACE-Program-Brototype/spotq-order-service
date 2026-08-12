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
├── application/
├── common/
├── config/
├── domain/
├── infrastructure/
├── interfaces/
├── app.ts
└── server.ts

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

This service follows the **Clean Architecture** pattern.

```text
src/
├── domain/            # Enterprise business rules
├── application/       # Application use cases
├── infrastructure/    # Database, queues, logging and external services
├── interfaces/        # Controllers, routes and API interfaces
├── config/            # Application configuration
├── common/            # Shared utilities
├── app.ts             # Express application configuration
└── server.ts          # Application startup
```

The architecture separates business logic from infrastructure concerns, making the service easier to maintain, test, and extend.

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
