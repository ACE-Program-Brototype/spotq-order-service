import type { RestaurantValidationResultDto } from "@application/dtos/external/restaurant-validation.dto.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import env from "@config/env.ts";
import { DomainError } from "@domain/errors/domain.error.ts";
import { ForbiddenRestaurantAccessError } from "@domain/errors/forbidden-restaurant-access.error.ts";
import { RestaurantNotEligibleError } from "@domain/errors/restaurant-not-eligible.error.ts";
import { RestaurantNotFoundError } from "@domain/errors/restaurant-not-found.error.ts";
import { getS2SInternalHeaders } from "@infrastructure/external/s2s-headers.ts";
import logger from "@infrastructure/logger/pino.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { RESTAURANT_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";

interface ApiResponseEnvelope<T> {
	success: boolean;
	data?: T;
	message?: string;
}

@injectable()
export class RestaurantServiceClient implements IRestaurantServiceClient {
	private readonly baseUrl: string = env.RESTAURANT_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.RESTAURANT_SERVICE_TIMEOUT_MS;

	public async validateRestaurant(
		restaurantId: string,
	): Promise<RestaurantValidationResultDto> {
		const targetUrl = `${this.baseUrl}${RESTAURANT_SERVICE_ROUTES.VALIDATION(restaurantId)}`;

		try {
			const response = await axios.get<
				ApiResponseEnvelope<RestaurantValidationResultDto>
			>(targetUrl, {
				headers: getS2SInternalHeaders(
					SERVICES.RESTAURANT_SERVICE,
					this.s2sPrivateKey,
					this.s2sServiceName,
				),
				timeout: this.requestTimeoutMs,
			});

			const responseBody = response.data;

			if (responseBody?.success !== true) {
				logger.error(
					{ restaurantId, response: responseBody },
					"Restaurant service returned unsuccessful validation response",
				);
				throw new Error(
					responseBody?.message || ORDER_MESSAGES.RESTAURANT_VALIDATION_FAILED,
				);
			}

			const validationData = responseBody.data;

			if (!validationData) {
				throw new RestaurantNotFoundError(
					`${ORDER_MESSAGES.RESTAURANT_NOT_FOUND}: ${restaurantId}`,
				);
			}

			if (validationData.isBlocked) {
				throw new RestaurantNotEligibleError(
					validationData.blockReason || ORDER_MESSAGES.RESTAURANT_NOT_ELIGIBLE,
				);
			}

			if (validationData.verificationStatus !== "ACTIVE") {
				throw new RestaurantNotEligibleError(
					`${ORDER_MESSAGES.RESTAURANT_NOT_ELIGIBLE} (status: ${validationData.verificationStatus})`,
				);
			}

			return validationData;
		} catch (error) {
			if (error instanceof DomainError) {
				throw error;
			}

			if (isAxiosError(error) && error.response) {
				const status = error.response.status;

				if (status === HttpStatus.NOT_FOUND) {
					throw new RestaurantNotFoundError(
						`${ORDER_MESSAGES.RESTAURANT_NOT_FOUND}: ${restaurantId}`,
					);
				}

				if (
					status === HttpStatus.FORBIDDEN ||
					status === HttpStatus.UNAUTHORIZED
				) {
					logger.warn(
						{ restaurantId, status },
						"Restaurant service rejected S2S request",
					);
					throw new ForbiddenRestaurantAccessError(
						ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS,
					);
				}

				logger.error(
					{
						restaurantId,
						status,
						data: error.response.data,
					},
					"Unexpected error response from restaurant validation endpoint",
				);
				throw new Error(
					`${ORDER_MESSAGES.RESTAURANT_VALIDATION_FAILED}: HTTP ${status}`,
				);
			}

			logger.error(
				{ err: error, restaurantId },
				"Error while communicating with restaurant-service",
			);
			throw error;
		}
	}
}
