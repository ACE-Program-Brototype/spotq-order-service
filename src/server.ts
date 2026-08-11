import env from "@config/env.js";
import {
	connectDatabase,
	disconnectDatabase,
} from "@infrastructure/database/prisma.connect.js";
import logger from "@infrastructure/logger/pino.js";
import {
	connectRedis,
	disconnectRedis,
} from "@infrastructure/redis/redis.connect.js";
import app from "./app.js";

async function startServer() {
	try {
		await connectDatabase();

		await connectRedis();

		const server = app.listen(env.PORT, () => {
			logger.info(`Order Service running on port ${env.PORT}`);
		});

		const shutdown = async (signal: string) => {
			logger.info(`${signal} received. Starting graceful shutdown...`);

			server.close(async () => {
				try {
					await disconnectDatabase();
					await disconnectRedis();

					logger.info("Graceful shutdown completed");
					process.exit(0);
				} catch (error) {
					logger.error(error, "Error during graceful shutdown");
					process.exit(1);
				}
			});
		};

		process.on("SIGINT", () => shutdown("SIGINT"));
		process.on("SIGTERM", () => shutdown("SIGTERM"));
	} catch (error) {
		logger.fatal(error, "Failed to start Order Service");
		process.exit(1);
	}
}

startServer();
