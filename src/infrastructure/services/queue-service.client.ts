import type { ActiveQueueUserResponseDto } from "@application/dtos/external/queue-active-user.dto.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/observability/logger.ts";
import { getS2SInternalHeaders } from "@infrastructure/services/s2s-headers.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { QUEUE_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
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

	public async checkUserActiveQueue(
		restaurantId: string,
		userId: string,
	): Promise<ActiveQueueUserResponseDto | null> {
		const targetUrl = `${this.baseUrl}${QUEUE_SERVICE_ROUTES.ACTIVE_USER_QUEUE(
			restaurantId,
			userId,
		)}`;

		try {
			const response = await axios.get<
				ApiResponseEnvelope<ActiveQueueUserResponseDto>
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
				if (error.response.status === HttpStatus.NOT_FOUND) {
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
				throw new Error(`Queue service error: HTTP ${error.response.status}`);
			}

			logger.error(
				{ err: error, restaurantId, userId },
				"Error while communicating with queue-service",
			);
			throw error;
		}
	}
}
