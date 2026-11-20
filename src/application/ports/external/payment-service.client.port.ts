import type {
	ProcessPaymentRefundInputDTO,
	ProcessPaymentRefundResponseDTO,
} from "@application/dtos/external/payment-refund.dto.ts";
import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";

export interface IPaymentServiceClient {
	createGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO>;
	processRefund(
		data: ProcessPaymentRefundInputDTO,
	): Promise<ProcessPaymentRefundResponseDTO>;
}
