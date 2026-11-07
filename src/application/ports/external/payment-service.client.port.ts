import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";

export interface IPaymentServiceClient {
	createGatewayOrder(
		data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO>;
}
