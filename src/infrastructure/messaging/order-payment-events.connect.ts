import type { IOrderPaymentEventsConsumer } from "@application/ports/messaging/order-payment-events.consumer.port.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import logger from "@infrastructure/observability/logger.ts";
import type { RabbitMQService } from "@infrastructure/rabbitmq/rabbitmq.service.ts";

export const startOrderPaymentEventsConsumer = async (): Promise<void> => {
	try {
		const rmq = container.get<RabbitMQService>(TYPES.RabbitMQService);
		if (!rmq.isConnected()) {
			throw new Error(
				"Cannot start OrderPaymentEventsConsumer: RabbitMQ is not connected",
			);
		}

		const consumer = container.get<IOrderPaymentEventsConsumer>(
			TYPES.OrderPaymentEventsConsumer,
		);
		await consumer.start();
	} catch (error) {
		logger.error(
			{ err: error },
			"Failed to start Order Payment Events Consumer",
		);
		throw error;
	}
};
