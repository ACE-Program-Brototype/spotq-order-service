import type {
	GetOrdersOverviewInputDto,
	OrdersOverviewResponseDto,
} from "@application/dtos/get-orders-overview.dto.ts";

export interface IGetOrdersOverviewUseCase {
	execute(dto: GetOrdersOverviewInputDto): Promise<OrdersOverviewResponseDto>;
}
