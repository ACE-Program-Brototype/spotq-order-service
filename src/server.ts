import env from "@config/env.ts";
import {
	connectDatabase,
	disconnectDatabase,
} from "@infrastructure/database/prisma.connect.ts";
import { startOrderPaymentEventsConsumer } from "@infrastructure/messaging/index.ts";
import { logger } from "@infrastructure/observability/logger.ts";
import {
	connectRabbitMQ,
	disconnectRabbitMQ,
} from "@infrastructure/rabbitmq/index.ts";
import {
	connectRedis,
	disconnectRedis,
} from "@infrastructure/redis/redis.connect.ts";
import app from "./app.js";

async function startServer() {
	try {
		await connectDatabase();
		await connectRedis();
		await connectRabbitMQ();
		await startOrderPaymentEventsConsumer();

		const server = app.listen(env.PORT, () => {
			logger.info(
				{ context: { port: env.PORT } },
				"Order Service started successfully",
			);
		});

		let isShuttingDown = false;

		const shutdown = async (signal: string) => {
			if (isShuttingDown) {
				logger.warn("Shutdown already in progress");
				return;
			}

			isShuttingDown = true;

			logger.info(
				{ context: { signal } },
				"Signal received. Starting graceful shutdown",
			);

			server.close(async (error) => {
				if (error) {
					logger.error({ err: error }, "Error while closing HTTP server");
					process.exitCode = 1;
				}

				try {
					await disconnectDatabase();
					await disconnectRedis();
					await disconnectRabbitMQ();

					logger.info("Graceful shutdown completed");
					process.exit(0);
				} catch (error) {
					logger.error({ err: error }, "Error during graceful shutdown");
					process.exit(1);
				}
			});
		};

		process.on("SIGINT", () => {
			void shutdown("SIGINT");
		});

		process.on("SIGTERM", () => {
			void shutdown("SIGTERM");
		});
	} catch (error) {
		logger.fatal({ err: error }, "Failed to start Order Service");
		process.exit(1);
	}
}

void startServer();
