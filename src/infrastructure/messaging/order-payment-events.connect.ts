import {
	orderPaymentEventsConsumer,
	rabbitMQService,
} from "@config/di/container.ts";
import logger from "@infrastructure/observability/logger.ts";

export const startOrderPaymentEventsConsumer = async (): Promise<void> => {
	try {
		if (!rabbitMQService.isConnected()) {
			throw new Error(
				"Cannot start OrderPaymentEventsConsumer: RabbitMQ is not connected",
			);
		}

		await orderPaymentEventsConsumer.start();
	} catch (error) {
		logger.error(
			{ err: error },
			"Failed to start Order Payment Events Consumer",
		);
		throw error;
	}
};
