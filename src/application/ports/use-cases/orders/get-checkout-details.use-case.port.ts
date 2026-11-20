import type {
	CheckoutDetailsResponseDTO,
	GetCheckoutDetailsInputDTO,
} from "@application/dtos/orders/checkout-details.dto.ts";

export interface IGetCheckoutDetailsUseCase {
	execute(dto: GetCheckoutDetailsInputDTO): Promise<CheckoutDetailsResponseDTO>;
}
