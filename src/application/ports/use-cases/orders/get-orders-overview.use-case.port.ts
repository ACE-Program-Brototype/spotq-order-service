import type {
	GetOrdersOverviewInputDto,
	OrdersOverviewResponseDto,
} from "@application/dtos/orders/get-orders-overview.dto";

export interface IGetOrdersOverviewUseCase {
	execute(dto: GetOrdersOverviewInputDto): Promise<OrdersOverviewResponseDto>;
}
