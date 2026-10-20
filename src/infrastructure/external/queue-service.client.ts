import type { ActiveQueueUserResponseDto } from "@application/dtos/external/queue-active-user.dto.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { QUEUE_SERVICE_ROUTES } from "@common/constants/routes.constants.ts";
import { SERVICES } from "@common/constants/services.constants.ts";
import env from "@config/env.ts";
import { getS2SInternalHeaders } from "@infrastructure/external/s2s-headers.ts";
import logger from "@infrastructure/logger/pino.ts";
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

			if (responseBody?.success !== true || !responseBody.data) {
				return null;
			}

			return responseBody.data;
		} catch (error) {
			if (isAxiosError(error) && error.response) {
				if (error.response.status === HTTP_STATUS.NOT_FOUND) {
					return null;
				}
				logger.warn(
					{
						restaurantId,
						userId,
						status: error.response.status,
						data: error.response.data,
					},
					"Queue service returned error response during active queue check",
				);
				return null;
			}

			logger.error(
				{ err: error, restaurantId, userId },
				"Error while communicating with queue-service",
			);
			return null;
		}
	}
}
