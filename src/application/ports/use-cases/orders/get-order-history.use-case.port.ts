import type {
	GetOrderHistoryInputDto,
	OrderHistoryResponseDto,
} from "@application/dtos/orders/get-order-history.dto.ts";

export interface IGetOrderHistoryUseCase {
	execute(dto: GetOrderHistoryInputDto): Promise<OrderHistoryResponseDto>;
}
