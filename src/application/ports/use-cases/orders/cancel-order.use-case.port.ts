import type {
	CancelOrderInputDTO,
	CancelOrderResponseDTO,
} from "@application/dtos/orders/cancel-order.dto.ts";

export interface ICancelOrderUseCase {
	execute(dto: CancelOrderInputDTO): Promise<CancelOrderResponseDTO>;
}
