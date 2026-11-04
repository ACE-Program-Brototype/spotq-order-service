import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import env from "@config/env.ts";
import { PaymentGatewayDraftFailedError } from "@domain/errors/payment-gateway-draft-failed.error.ts";
import logger from "@infrastructure/observability/logger.ts";
import { getS2SInternalHeaders } from "@infrastructure/services/s2s-headers.ts";
import { PAYMENT_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";

interface ApiResponseEnvelope<T> {
	success: boolean;
	data?: T;
	message?: string;
}

@injectable()
export class PaymentServiceClient implements IPaymentServiceClient {
	private readonly baseUrl: string = env.PAYMENT_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.PAYMENT_SERVICE_TIMEOUT_MS;

	public async createGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO> {
		const targetUrl = `${this.baseUrl}${PAYMENT_SERVICE_ROUTES.CREATE_GATEWAY_ORDER}`;

		try {
			const response = await axios.post<
				ApiResponseEnvelope<CreateOrderPaymentResponseDTO>
			>(targetUrl, data, {
				headers: {
					...getS2SInternalHeaders(
						SERVICES.PAYMENT_SERVICE,
						this.s2sPrivateKey,
						this.s2sServiceName,
					),
					"Content-Type": "application/json",
				},
				timeout: this.requestTimeoutMs,
			});

			const responseBody = response.data;

			if (responseBody?.success !== true || !responseBody.data) {
				logger.error(
					{ orderId: data.orderId, response: responseBody },
					"Payment service returned unsuccessful response during gateway draft creation",
				);
				throw new PaymentGatewayDraftFailedError(
					responseBody?.message ||
						"Payment service gateway draft creation failed",
				);
			}

			return responseBody.data;
		} catch (error) {
			if (error instanceof PaymentGatewayDraftFailedError) {
				throw error;
			}

			if (isAxiosError(error) && error.response) {
				logger.error(
					{
						status: error.response.status,
						orderId: data.orderId,
						data: error.response.data,
					},
					"Payment service rejected gateway order draft creation",
				);
				const errorMsg =
					(error.response.data as { message?: string })?.message ||
					`Payment service returned HTTP ${error.response.status}`;
				throw new PaymentGatewayDraftFailedError(errorMsg);
			}

			logger.error(
				{ err: error, orderId: data.orderId },
				"Error while communicating with payment service for gateway draft creation",
			);
			throw new PaymentGatewayDraftFailedError(
				error instanceof Error ? error.message : "Payment service unavailable",
			);
		}
	}
}
