import type { ActiveQueueUserResponseDTO } from "@application/dtos/external/queue-active-user.dto.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/observability/logger.ts";
import { createServiceCircuitBreaker } from "@infrastructure/services/circuit-breaker.factory.ts";
import { getS2SInternalHeaders } from "@infrastructure/services/s2s-headers.ts";
import { HTTP_STATUS } from "@shared/constants/http.constants.ts";
import { QUEUE_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
import {
	DownstreamServiceTimeoutError,
	DownstreamServiceUnavailableError,
} from "@shared/errors/index.ts";
import {
	type CircuitBreaker,
	CircuitBreakerOpenError,
	CircuitBreakerTimeoutError,
} from "@spotq-org/circuit-breaker";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";

interface ApiResponseEnvelope<T> {
	success: boolean;
	data?: T;
	message?: string;
}

@injectable()
export class QueueServiceClient implements IQueueServiceClient {
	private readonly baseUrl: string = env.QUEUE_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.QUEUE_SERVICE_TIMEOUT_MS;
	private readonly breaker: CircuitBreaker<
		[string, string],
		ActiveQueueUserResponseDTO | null
	>;

	constructor() {
		this.breaker = createServiceCircuitBreaker<
			[string, string],
			ActiveQueueUserResponseDTO | null
		>(
			(restaurantId, userId) => this.fetchUserActiveQueue(restaurantId, userId),
			{
				name: "queue-service-active-user",
				serviceName: SERVICES.QUEUE_SERVICE,
				endpointTag:
					"GET /api/internal/v1/restaurants/:id/queue/users/:userId/active",
				timeoutMs: this.requestTimeoutMs,
				checkIsFailure: (error: unknown) => {
					if (isAxiosError(error) && error.response) {
						const status = error.response.status;
						// 404 (user not in queue) and other 4xx client errors do not count toward circuit failure
						if (status < 500) {
							return false;
						}
					}
					return true;
				},
			},
		);
	}

	public async checkUserActiveQueue(
		restaurantId: string,
		userId: string,
	): Promise<ActiveQueueUserResponseDTO | null> {
		try {
			return await this.breaker.execute(restaurantId, userId);
		} catch (error) {
			if (error instanceof CircuitBreakerOpenError) {
				logger.warn(
					{
						restaurantId,
						userId,
						breaker: this.breaker.name,
						service: SERVICES.QUEUE_SERVICE,
					},
					"Circuit breaker is OPEN. Fast-failing checkUserActiveQueue request.",
				);
				throw new DownstreamServiceUnavailableError(
					SERVICES.QUEUE_SERVICE,
					"Downstream queue service is currently unavailable",
				);
			}

			if (error instanceof CircuitBreakerTimeoutError) {
				logger.warn(
					{
						restaurantId,
						userId,
						breaker: this.breaker.name,
						service: SERVICES.QUEUE_SERVICE,
					},
					"Circuit breaker timed out for checkUserActiveQueue request.",
				);
				throw new DownstreamServiceTimeoutError(
					SERVICES.QUEUE_SERVICE,
					"Downstream queue service timed out",
				);
			}

			throw error;
		}
	}

	private async fetchUserActiveQueue(
		restaurantId: string,
		userId: string,
	): Promise<ActiveQueueUserResponseDTO | null> {
		const targetUrl = `${this.baseUrl}${QUEUE_SERVICE_ROUTES.ACTIVE_USER_QUEUE(
			restaurantId,
			userId,
		)}`;

		try {
			const response = await axios.get<
				ApiResponseEnvelope<ActiveQueueUserResponseDTO>
			>(targetUrl, {
				headers: getS2SInternalHeaders(
					SERVICES.QUEUE_SERVICE,
					this.s2sPrivateKey,
					this.s2sServiceName,
				),
				timeout: this.requestTimeoutMs,
			});

			const responseBody = response.data;

			if (responseBody?.success !== true) {
				logger.error(
					{ restaurantId, userId, response: responseBody },
					"Queue service returned unsuccessful response during active queue check",
				);
				throw new Error(
					responseBody?.message || "Queue service active queue check failed",
				);
			}

			return responseBody.data ?? null;
		} catch (error) {
			if (isAxiosError(error) && error.response) {
				if (error.response.status === HTTP_STATUS.NOT_FOUND) {
					return null;
				}
				logger.error(
					{
						restaurantId,
						userId,
						status: error.response.status,
						data: error.response.data,
					},
					"Queue service returned error response during active queue check",
				);
				throw new DownstreamServiceUnavailableError(
					SERVICES.QUEUE_SERVICE,
					`Queue service error: HTTP ${error.response.status}`,
				);
			}

			logger.error(
				{ err: error, restaurantId, userId },
				"Error while communicating with queue-service",
			);
			throw error;
		}
	}

	public shutdown(): void {
		this.breaker.shutdown();
	}
}
