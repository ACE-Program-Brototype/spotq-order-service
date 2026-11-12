import type {
	ProcessPaymentRefundInputDTO,
	ProcessPaymentRefundResponseDTO,
} from "@application/dtos/external/payment-refund.dto.ts";
import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import env from "@config/env.ts";
import {
	PaymentGatewayDraftFailedError,
	PaymentRefundFailedError,
} from "@domain/errors/index.ts";
import logger from "@infrastructure/observability/logger.ts";
import { createServiceCircuitBreaker } from "@infrastructure/services/circuit-breaker.factory.ts";
import { getS2SInternalHeaders } from "@infrastructure/services/s2s-headers.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { PAYMENT_SERVICE_ROUTES } from "@shared/constants/routes.constants.ts";
import {
	PAYMENT_CIRCUIT_BREAKER,
	PAYMENT_CLIENT_MESSAGES,
	PAYMENT_REFUND_DEFAULTS,
	SERVICES,
} from "@shared/constants/services.constants.ts";
import {
	DownstreamServiceTimeoutError,
	DownstreamServiceUnavailableError,
} from "@shared/errors/index.ts";
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
	private readonly refundBreaker: CircuitBreaker<
		[ProcessPaymentRefundInputDTO],
		ProcessPaymentRefundResponseDTO
	>;

	constructor() {
		this.breaker = createServiceCircuitBreaker<
			[CreateOrderPaymentInputDTO],
			CreateOrderPaymentResponseDTO
		>((data) => this.fetchCreateGatewayOrder(data), {
			name: PAYMENT_CIRCUIT_BREAKER.GATEWAY_ORDER.NAME,
			serviceName: SERVICES.PAYMENT_SERVICE,
			endpointTag: PAYMENT_CIRCUIT_BREAKER.GATEWAY_ORDER.ENDPOINT_TAG,
			checkIsFailure: (error: unknown) => {
				if (isAxiosError(error) && error.response) {
					return error.response.status >= HttpStatus.INTERNAL_SERVER_ERROR;
				}
				return true;
			},
		});

		this.refundBreaker = createServiceCircuitBreaker<
			[ProcessPaymentRefundInputDTO],
			ProcessPaymentRefundResponseDTO
		>((data) => this.fetchProcessRefund(data), {
			name: PAYMENT_CIRCUIT_BREAKER.REFUND.NAME,
			serviceName: SERVICES.PAYMENT_SERVICE,
			endpointTag: PAYMENT_CIRCUIT_BREAKER.REFUND.ENDPOINT_TAG,
			checkIsFailure: (error: unknown) => {
				if (isAxiosError(error) && error.response) {
					return error.response.status >= HttpStatus.INTERNAL_SERVER_ERROR;
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
				throw new DownstreamServiceUnavailableError(
					SERVICES.PAYMENT_SERVICE,
					ORDER_MESSAGES.PAYMENT_SERVICE_UNAVAILABLE,
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
				throw new DownstreamServiceTimeoutError(
					SERVICES.PAYMENT_SERVICE,
					ORDER_MESSAGES.PAYMENT_SERVICE_TIMEOUT,
				);
			}

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
				throw new PaymentGatewayDraftFailedError(
					this.extractErrorMessage(
						error,
						PAYMENT_CLIENT_MESSAGES.GATEWAY_DRAFT_FAILED,
					),
				);
			}

			logger.error(
				{ err: error, orderId: data.orderId },
				"Error while communicating with payment service for gateway draft creation",
			);
			throw new PaymentGatewayDraftFailedError(
				this.extractErrorMessage(
					error,
					PAYMENT_CLIENT_MESSAGES.SERVICE_UNAVAILABLE,
				),
			);
		}
	}

	public async processRefund(
		data: ProcessPaymentRefundInputDTO,
	): Promise<ProcessPaymentRefundResponseDTO> {
		try {
			return await this.refundBreaker.execute(data);
		} catch (error) {
			if (error instanceof CircuitBreakerOpenError) {
				logger.warn(
					{
						orderId: data.orderId,
						breaker: this.refundBreaker.name,
						service: SERVICES.PAYMENT_SERVICE,
					},
					"Circuit breaker is OPEN. Fast-failing processRefund request.",
				);
				throw new DownstreamServiceUnavailableError(
					SERVICES.PAYMENT_SERVICE,
					ORDER_MESSAGES.PAYMENT_SERVICE_UNAVAILABLE,
				);
			}

			if (error instanceof CircuitBreakerTimeoutError) {
				logger.warn(
					{
						orderId: data.orderId,
						breaker: this.refundBreaker.name,
						service: SERVICES.PAYMENT_SERVICE,
					},
					"Circuit breaker timed out for processRefund request.",
				);
				throw new DownstreamServiceTimeoutError(
					SERVICES.PAYMENT_SERVICE,
					ORDER_MESSAGES.PAYMENT_REFUND_TIMEOUT,
				);
			}

			if (error instanceof PaymentRefundFailedError) {
				throw error;
			}

			if (isAxiosError(error) && error.response) {
				if (error.response.status === HttpStatus.CONFLICT) {
					logger.info(
						{ orderId: data.orderId, response: error.response.data },
						"Payment already refunded in payment service. Treating as idempotent success.",
					);
					const responseData = (
						error.response.data as {
							data?: { refundId?: string; status?: string };
						}
					)?.data;
					return {
						refundId:
							responseData?.refundId ??
							PAYMENT_REFUND_DEFAULTS.ALREADY_REFUNDED_ID,
						orderId: data.orderId,
						status:
							responseData?.status ?? PAYMENT_REFUND_DEFAULTS.STATUS_PROCESSED,
					};
				}

				logger.error(
					{
						status: error.response.status,
						orderId: data.orderId,
						data: error.response.data,
					},
					"Payment service rejected refund processing",
				);
				throw new PaymentRefundFailedError(
					this.extractErrorMessage(
						error,
						PAYMENT_CLIENT_MESSAGES.REFUND_FAILED,
					),
				);
			}

			logger.error(
				{ err: error, orderId: data.orderId },
				"Error while communicating with payment service for refund processing",
			);
			throw new PaymentRefundFailedError(
				this.extractErrorMessage(
					error,
					PAYMENT_CLIENT_MESSAGES.SERVICE_UNAVAILABLE,
				),
			);
		}
	}

	private extractErrorMessage(error: unknown, fallbackMessage: string): string {
		if (isAxiosError(error) && error.response) {
			const responseMessage = (error.response.data as { message?: string })
				?.message;
			return (
				responseMessage ||
				PAYMENT_CLIENT_MESSAGES.HTTP_ERROR(error.response.status)
			);
		}
		if (error instanceof Error) {
			return error.message;
		}
		return fallbackMessage;
	}

	private async fetchCreateGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO> {
		const targetUrl = `${this.baseUrl}${PAYMENT_SERVICE_ROUTES.CREATE_GATEWAY_ORDER}`;

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
				responseBody?.message || PAYMENT_CLIENT_MESSAGES.GATEWAY_DRAFT_FAILED,
			);
		}

		return responseBody.data;
	}

	private async fetchProcessRefund(
		data: ProcessPaymentRefundInputDTO,
	): Promise<ProcessPaymentRefundResponseDTO> {
		const targetUrl = `${this.baseUrl}${PAYMENT_SERVICE_ROUTES.PROCESS_REFUND}`;

		const response = await axios.post<
			ApiResponseSuccess<ProcessPaymentRefundResponseDTO>
		>(
			targetUrl,
			{
				orderId: data.orderId,
				amountPaise: data.amountPaise,
				reason: data.reason,
				notes: data.notes,
			},
			{
				headers: {
					...getS2SInternalHeaders(
						SERVICES.PAYMENT_SERVICE,
						this.s2sPrivateKey,
						this.s2sServiceName,
					),
					"x-idempotency-key": data.idempotencyKey,
				},
				timeout: this.requestTimeoutMs,
			},
		);

		const responseBody = response.data;

		if (responseBody?.success !== true || !responseBody.data) {
			logger.error(
				{ orderId: data.orderId, response: responseBody },
				"Payment service returned unsuccessful response during refund processing",
			);
			throw new PaymentRefundFailedError(
				responseBody?.message || PAYMENT_CLIENT_MESSAGES.REFUND_FAILED,
			);
		}

		return responseBody.data;
	}
}
