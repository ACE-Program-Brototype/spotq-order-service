import type {
	GetOrdersOverviewInputDTO,
	OrdersOverviewResponseDTO,
} from "@application/dtos/orders/get-orders-overview.dto.ts";

export interface IGetOrdersOverviewUseCase {
	execute(dto: GetOrdersOverviewInputDTO): Promise<OrdersOverviewResponseDTO>;
}
