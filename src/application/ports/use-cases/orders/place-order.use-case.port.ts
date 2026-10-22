import type {
	OrderResponseDto,
	PlaceOrderInputDto,
} from "@application/dtos/orders/place-order.dto.ts";

export interface IPlaceOrderUseCase {
	execute(dto: PlaceOrderInputDto): Promise<OrderResponseDto>;
}
