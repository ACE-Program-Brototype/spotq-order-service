import type {
	GetOrderHistoryInputDTO,
	OrderHistoryResponseDTO,
} from "@application/dtos/orders/get-order-history.dto.ts";

export interface IGetOrderHistoryUseCase {
	execute(dto: GetOrderHistoryInputDTO): Promise<OrderHistoryResponseDTO>;
}
