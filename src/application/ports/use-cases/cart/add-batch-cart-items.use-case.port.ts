import type {
	AddBatchCartItemsDTO,
	AddBatchCartItemsResponseDTO,
} from "@application/dtos/cart/add-batch-cart-items.dto.ts";

export interface IAddBatchCartItemsUseCase {
	execute(dto: AddBatchCartItemsDTO): Promise<AddBatchCartItemsResponseDTO>;
}
