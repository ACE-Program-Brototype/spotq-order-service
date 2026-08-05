# SpotQ Order Service

Order Service is a backend microservice responsible for managing the complete order lifecycle within the SpotQ platform. It is built using **Node.js**, **TypeScript**, and **Express.js**, following **Clean Architecture** principles to ensure scalability, maintainability, and testability.

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
└── main.ts

prisma/
docker/
.github/
```

---

## Tech Stack

| Technology     | Purpose                   |
| -------------- | ------------------------- |
| Node.js        | Runtime                   |
| TypeScript     | Programming Language      |
| Express.js     | HTTP Server               |
| Prisma         | ORM                       |
| PostgreSQL     | Database                  |
| Redis          | Caching & Queue Backend   |
| BullMQ         | Background Job Processing |
| Pino           | Logging                   |
| Swagger        | API Documentation         |
| Docker         | Containerization          |
| GitHub Actions | Continuous Integration    |
| Biome          | Formatting & Linting      |
| Husky          | Git Hooks                 |

---

## Prerequisites

Ensure the following tools are installed before running the project:

* Node.js (LTS)
* npm
* Docker Desktop
* PostgreSQL
* Redis
* Git

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
npm install
```

---

## Environment Variables

Create a `.env` file by copying the example file.

```bash
cp .env.example .env
```

Example configuration:

```env
NODE_ENV=development

PORT=3000

DATABASE_URL=

REDIS_HOST=

REDIS_PORT=

JWT_SECRET=

DOPPLER_TOKEN=
```

> Populate the values according to your local development environment or Doppler configuration.

---

## Running the Application

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

---

## Running with Docker

Build and start the service:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d
```

Stop the containers:

```bash
docker compose down
```

---

## API Documentation

Once the application is running, Swagger documentation will be available at:

```text
http://localhost:3000/api/docs
```

---

## Health Check

Verify the service status:

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

| Script                    | Description                  |
| ------------------------- | ---------------------------- |
| `npm run dev`             | Start development server     |
| `npm run build`           | Compile TypeScript           |
| `npm start`               | Run compiled application     |
| `npm run lint`            | Run Biome linting            |
| `npm run format`          | Format source code           |
| `npm run check`           | Run formatting and linting   |
| `npm run typecheck`       | Run TypeScript type checking |
| `npm run prisma:generate` | Generate Prisma Client       |
| `npm run prisma:migrate`  | Run Prisma migrations        |

---

## Continuous Integration

The GitHub Actions pipeline performs the following checks:

* Install dependencies
* Run Biome linting
* Run TypeScript type checking
* Build the application

All pull requests must pass the CI pipeline before they can be merged.

---

## Architecture

This service follows the **Clean Architecture** pattern.

```text
src/
├── domain/            # Enterprise business rules
├── application/       # Use cases
├── infrastructure/    # Database, queues, external services
├── interfaces/        # Controllers, routes, DTOs
├── config/            # Application configuration
├── common/            # Shared utilities
└── main.ts            # Application entry point
```

---

## Development Workflow

1. Create a feature branch from `development`.
2. Implement the assigned Jira story.
3. Commit changes using conventional commit messages.
4. Push the feature branch.
5. Create a Pull Request targeting the `development` branch.
6. Resolve review comments.
7. Merge after approval and successful CI.

---

## License

This repository is part of the **SpotQ** project and is intended for internal development and collaboration within the team.
