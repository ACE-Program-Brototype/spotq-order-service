import type {
	OrderResponseDTO,
	PlaceOrderInputDTO,
} from "@application/dtos/orders/place-order.dto.ts";
import { OrderResponseMapper } from "@application/mappers/order-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { generateOrderNumber } from "@application/utils/order-number.util.ts";
import { TYPES } from "@config/di/types.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { OrderPriority } from "@domain/enums/order-priority.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { InvalidPaymentModeError } from "@domain/errors/invalid-payment-mode.error.ts";
import type { ICartRepository } from "@domain/repositories/i-cart.repository.ts";
import type { IOrderRepository } from "@domain/repositories/i-order.repository.ts";
import { ORDER_DEFAULTS } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class PlaceOrderUseCase implements IPlaceOrderUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,
		@inject(TYPES.MenuItemCatalogPort)
		private readonly catalogPort: IMenuItemCatalogPort,
		@inject(TYPES.QueueServiceClient)
		private readonly queueServiceClient: IQueueServiceClient,
	) {}

	public async execute(dto: PlaceOrderInputDTO): Promise<OrderResponseDTO> {
		if (dto.paymentMode === PaymentMode.ONLINE) {
			throw new InvalidPaymentModeError();
		}

		let cart: Cart | null = null;
		if (dto.cartId) {
			cart = await this.cartRepository.findById(dto.cartId);
		} else {
			cart = await this.cartRepository.findActiveByUserId(
				dto.userId,
				dto.restaurantId,
			);
		}

		if (!cart) {
			throw new CartNotFoundError();
		}

		cart.validateAccess(dto.userId);

		if (dto.restaurantId) {
			cart.validateRestaurant(dto.restaurantId);
		}

		if (cart.isExpired()) {
			if (cart.status !== CartStatus.EXPIRED) {
				await this.cartRepository.update(cart.id, {
					status: CartStatus.EXPIRED,
				});
			}
			throw new CartExpiredError();
		}

		if (!cart.items || cart.items.length === 0) {
			throw new CartEmptyError();
		}

		const restaurantValidation =
			await this.restaurantServiceClient.validateRestaurant(cart.restaurantId);

		const orderItemsData = await Promise.all(
			cart.items.map(async (cartItem) => {
				const addonIds = cartItem.addons.map((a) => a.addonId);
				const catalogItem = await this.catalogPort.getItemDetails(
					cart.restaurantId,
					cartItem.menuItemId,
					cartItem.variantId,
					addonIds,
				);

				validateCatalogItemAvailability(
					catalogItem,
					cartItem.variantId,
					addonIds,
				);

				const unitPrice =
					catalogItem.variant?.price ?? catalogItem.price ?? cartItem.unitPrice;
				const itemName =
					catalogItem.name ?? cartItem.menuItemName ?? ORDER_DEFAULTS.ITEM_NAME;
				const variantName =
					catalogItem.variant?.name ?? cartItem.variantName ?? null;
				const catalogAddonsMap = new Map(
					catalogItem.addons.map((a) => [a.addonId, a]),
				);

				const addons = cartItem.addons.map((a) => {
					const catalogAddon = catalogAddonsMap.get(a.addonId);
					return {
						addonId: a.addonId,
						addonName:
							catalogAddon?.name ?? a.addonName ?? ORDER_DEFAULTS.ADDON_NAME,
						price: catalogAddon?.price ?? a.price,
					};
				});

				return {
					menuItemId: cartItem.menuItemId,
					itemName,
					variantId: cartItem.variantId,
					variantName,
					quantity: cartItem.quantity,
					unitPrice,
					specialInstructions: cartItem.specialInstructions,
					addons,
				};
			}),
		);

		let priority: number = OrderPriority.NORMAL;
		let queueEntryId: string | null = null;
		let orderType: OrderType = OrderType.DINE_IN;
		let tableId: string | null = null;
		let tableNumber: number | null = null;

		if (restaurantValidation.canAccessQueueService) {
			const activeQueue = await this.queueServiceClient.checkUserActiveQueue(
				cart.restaurantId,
				dto.userId,
			);

			if (activeQueue?.hasActiveQueue && activeQueue.queueEntry) {
				priority = OrderPriority.QUEUE;
				queueEntryId = activeQueue.queueEntry.queueEntryId;
				orderType = OrderType.PRE_ORDER;
			}
		}

		if (!queueEntryId) {
			const activeOrder = await this.orderRepository.findActiveByUserId(
				cart.restaurantId,
				dto.userId,
			);

			if (activeOrder) {
				priority = OrderPriority.ADDON;
				orderType = OrderType.DINE_IN;
				tableId = activeOrder.tableId;
				tableNumber = activeOrder.tableNumber;
			}
		}

		const orderNumber = generateOrderNumber();
		const order = new Order({
			orderNumber,
			restaurantId: cart.restaurantId,
			restaurantName: restaurantValidation.restaurantName,
			userId: dto.userId,
			userName: dto.userName ?? null,
			userPhone: dto.userPhone ?? null,
			tableId,
			tableNumber,
			queueEntryId,
			priority,
			orderType,
			paymentMode: dto.paymentMode,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			specialInstructions: dto.specialInstructions ?? null,
			items: orderItemsData,
			statusHistory: [
				{
					previousStatus: null,
					currentStatus: OrderStatus.PLACED,
					changedBy: dto.userId,
					notes: ORDER_DEFAULTS.AUDIT_NOTE,
					createdAt: new Date(),
				},
			],
		});

		const createdOrder = await this.orderRepository.create(order, cart.id);

		return OrderResponseMapper.toDTO(createdOrder);
	}
}
