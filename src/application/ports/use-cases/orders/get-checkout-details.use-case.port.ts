import type {
	CheckoutDetailsResponseDto,
	GetCheckoutDetailsInputDto,
} from "@application/dtos/orders/checkout-details.dto.ts";

export interface IGetCheckoutDetailsUseCase {
	execute(dto: GetCheckoutDetailsInputDto): Promise<CheckoutDetailsResponseDto>;
}
