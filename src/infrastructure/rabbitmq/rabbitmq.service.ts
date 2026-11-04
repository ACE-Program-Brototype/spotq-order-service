import env from "@config/env.ts";
import logger from "@infrastructure/observability/logger.ts";
import {
	type ConsumeOptions,
	type MessageHandler,
	type PublishOptions,
	RabbitMQClient,
} from "@spotq-org/rabbitmq-client";
import { injectable } from "inversify";

@injectable()
export class RabbitMQService {
	private readonly client: RabbitMQClient;

	constructor() {
		this.client = new RabbitMQClient({
			url: env.RABBITMQ_URL,
			serviceName: env.SERVICE_NAME,
			logger,
			prefetchCount: 10,
			dlqOptions: {
				enabled: true,
			},
		});
	}

	public async connect(): Promise<void> {
		return this.client.connect();
	}

	public async disconnect(): Promise<void> {
		return this.client.close();
	}

	public isConnected(): boolean {
		return this.client.isConnected();
	}

	public async publishToQueue<T = unknown>(
		queue: string,
		message: T,
		options?: PublishOptions,
	): Promise<boolean> {
		return this.client.publishToQueue(queue, message, options);
	}

	public async consumeFromQueue<T = unknown>(
		queue: string,
		handler: MessageHandler<T>,
		options?: ConsumeOptions,
	): Promise<void> {
		return this.client.consumeFromQueue(queue, handler, options);
	}
}
