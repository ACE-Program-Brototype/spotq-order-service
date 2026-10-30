import type {
	OrderResponseDTO,
	PlaceOrderInputDTO,
} from "@application/dtos/orders/place-order.dto.ts";

export interface IPlaceOrderUseCase {
	execute(dto: PlaceOrderInputDTO): Promise<OrderResponseDTO>;
}
