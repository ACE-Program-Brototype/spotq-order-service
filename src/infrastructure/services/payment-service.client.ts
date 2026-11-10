import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import env from "@config/env.ts";
import { PaymentGatewayDraftFailedError } from "@domain/errors/payment-gateway-draft-failed.error.ts";
import logger from "@infrastructure/observability/logger.ts";
import { createServiceCircuitBreaker } from "@infrastructure/services/circuit-breaker.factory.ts";
import { getS2SInternalHeaders } from "@infrastructure/services/s2s-headers.ts";
import { PAYMENT_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
import type { ApiResponseSuccess } from "@shared/responses/api-response.ts";
import {
	type CircuitBreaker,
	CircuitBreakerOpenError,
	CircuitBreakerTimeoutError,
} from "@spotq-org/circuit-breaker";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";

@injectable()
export class PaymentServiceClient implements IPaymentServiceClient {
	private readonly baseUrl: string = env.PAYMENT_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.PAYMENT_SERVICE_TIMEOUT_MS;
	private readonly breaker: CircuitBreaker<
		[CreateOrderPaymentInputDTO],
		CreateOrderPaymentResponseDTO
	>;

	constructor() {
		this.breaker = createServiceCircuitBreaker<
			[CreateOrderPaymentInputDTO],
			CreateOrderPaymentResponseDTO
		>((data) => this.fetchCreateGatewayOrder(data), {
			name: "payment-service-gateway-order",
			serviceName: SERVICES.PAYMENT_SERVICE,
			endpointTag: "POST /api/internal/v1/payments/gateway-order",
			timeoutMs: this.requestTimeoutMs,
			checkIsFailure: (error: unknown) => {
				if (isAxiosError(error) && error.response) {
					const status = error.response.status;
					// 4xx client errors (bad request, validation) do not count toward circuit failure
					if (status < 500) {
						return false;
					}
				}
				return true;
			},
		});
	}

	public async createGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO> {
		try {
			return await this.breaker.execute(data);
		} catch (error) {
			if (error instanceof CircuitBreakerOpenError) {
				logger.warn(
					{
						orderId: data.orderId,
						breaker: this.breaker.name,
						service: SERVICES.PAYMENT_SERVICE,
					},
					"Circuit breaker is OPEN. Fast-failing createGatewayOrder request.",
				);
				throw new PaymentGatewayDraftFailedError(
					"Payment service is currently unavailable. Please try again shortly.",
				);
			}

			if (error instanceof CircuitBreakerTimeoutError) {
				logger.warn(
					{
						orderId: data.orderId,
						breaker: this.breaker.name,
						service: SERVICES.PAYMENT_SERVICE,
					},
					"Circuit breaker timed out for createGatewayOrder request.",
				);
				throw new PaymentGatewayDraftFailedError(
					"Payment service timed out while creating gateway order",
				);
			}

			throw error;
		}
	}

	private async fetchCreateGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO> {
		const targetUrl = `${this.baseUrl}${PAYMENT_SERVICE_ROUTES.CREATE_GATEWAY_ORDER}`;

		try {
			const response = await axios.post<
				ApiResponseSuccess<CreateOrderPaymentResponseDTO>
			>(targetUrl, data, {
				headers: getS2SInternalHeaders(
					SERVICES.PAYMENT_SERVICE,
					this.s2sPrivateKey,
					this.s2sServiceName,
				),
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

	public shutdown(): void {
		this.breaker.shutdown();
	}
}
