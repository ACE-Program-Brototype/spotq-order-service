import type {
	UpdateOrderStatusInputDTO,
	UpdateOrderStatusResponseDTO,
} from "@application/dtos/orders/update-order-status.dto.ts";

export interface IUpdateOrderStatusUseCase {
	execute(
		dto: UpdateOrderStatusInputDTO,
	): Promise<UpdateOrderStatusResponseDTO>;
}
