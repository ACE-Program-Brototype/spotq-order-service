import type {
	CancelOrderInputDto,
	CancelOrderResponseDto,
} from "@application/dtos/orders/cancel-order.dto.ts";

export interface ICancelOrderUseCase {
	execute(dto: CancelOrderInputDto): Promise<CancelOrderResponseDto>;
}
