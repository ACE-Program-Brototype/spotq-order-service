import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/get-cart.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetCartUseCase implements IGetCartUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(dto: GetCartRequestDto): Promise<GetCartResponseDto> {
		const cart = await this.cartRepository.findById(dto.cartId);

		if (!cart) {
			throw new CartNotFoundError();
		}

		if (cart.userId !== dto.authenticatedUserId) {
			throw new ForbiddenCartAccessError();
		}

		if (cart.isExpired()) {
			throw new CartExpiredError();
		}

		return CartResponseMapper.toDto(cart);
	}
}

export default GetCartUseCase;
