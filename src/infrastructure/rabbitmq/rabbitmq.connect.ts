import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import logger from "@infrastructure/observability/logger.ts";
import type { RabbitMQService } from "./rabbitmq.service.ts";

export const connectRabbitMQ = async (): Promise<void> => {
	try {
		const rmq = container.get<RabbitMQService>(TYPES.RabbitMQService);
		await rmq.connect();
		logger.info("Connected to RabbitMQ broker");
	} catch (error) {
		logger.error({ err: error }, "Failed to connect to RabbitMQ on startup");
		throw error;
	}
};

export const disconnectRabbitMQ = async (): Promise<void> => {
	try {
		const rmq = container.get<RabbitMQService>(TYPES.RabbitMQService);
		await rmq.disconnect();
		logger.info("RabbitMQ disconnected");
	} catch (error) {
		logger.error({ err: error }, "Error while disconnecting RabbitMQ");
	}
};
