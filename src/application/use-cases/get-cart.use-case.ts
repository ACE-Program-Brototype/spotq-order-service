import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/get-cart.dto.ts";
import type { ICartRepository } from "@application/ports/repositories/cart.repository.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
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
			if (cart.status !== CartStatus.EXPIRED) {
				await this.cartRepository.updateStatus(cart.id, CartStatus.EXPIRED);
			}
			throw new CartExpiredError();
		}

		const subtotal = cart.calculateSubtotal();
		const itemCount = cart.calculateItemCount();

		return {
			cartId: cart.id,
			restaurantId: cart.restaurantId,
			userId: cart.userId,
			status: cart.status,
			itemCount,
			subtotal,
			createdAt: cart.createdAt.toISOString(),
			updatedAt: cart.updatedAt.toISOString(),
			expiresAt: cart.expiresAt.toISOString(),
			items: cart.items.map((item) => ({
				id: item.id,
				menuItemId: item.menuItemId,
				menuItemName: item.menuItemName ?? "",
				variantId: item.variantId,
				variantName: item.variantName ?? null,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				specialInstructions: item.specialInstructions,
				addons: item.addons.map((addon) => ({
					addonId: addon.addonId,
					addonName: addon.addonName ?? "",
					price: addon.price,
				})),
			})),
		};
	}
}

export default GetCartUseCase;
