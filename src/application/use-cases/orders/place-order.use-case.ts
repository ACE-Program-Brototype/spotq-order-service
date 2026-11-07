import type {
	OrderResponseDTO,
	PlaceOrderInputDTO,
} from "@application/dtos/orders/place-order.dto.ts";
import { OrderResponseMapper } from "@application/mappers/orders/order-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { generateOrderNumber } from "@application/utils/order-number.util.ts";
import { TYPES } from "@config/di/types.ts";
import env from "@config/env.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import {
	CartEmptyError,
	CartExpiredError,
	CartNotFoundError,
} from "@domain/errors/cart.errors.ts";
import {
	ActiveQueueEntryRequiredError,
	InvalidPaymentModeError,
	OrderingModeNotSupportedError,
} from "@domain/errors/order.errors.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
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
		@inject(TYPES.PaymentServiceClient)
		private readonly paymentServiceClient: IPaymentServiceClient,
	) {}

	public async execute(dto: PlaceOrderInputDTO): Promise<OrderResponseDTO> {
		if (dto.paymentMode !== PaymentMode.ONLINE) {
			throw new InvalidPaymentModeError();
		}

		if (dto.idempotencyKey) {
			const existingOrder = await this.orderRepository.findByIdempotencyKey(
				dto.idempotencyKey,
			);
			if (existingOrder) {
				let paymentDraft = null;
				if (
					existingOrder.paymentMode === PaymentMode.ONLINE &&
					existingOrder.paymentStatus === PaymentStatus.PENDING
				) {
					const amountPaise = Math.round(existingOrder.grandTotal * 100);
					paymentDraft = await this.paymentServiceClient.createGatewayOrder({
						orderId: existingOrder.id,
						customerId: existingOrder.userId ?? dto.userId,
						restaurantId: existingOrder.restaurantId,
						amountPaise,
						currency: "INR",
					});
				}
				return OrderResponseMapper.toDTO(existingOrder, paymentDraft);
			}
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
		cart.validateRestaurant(dto.restaurantId);

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

		let orderingMode: OrderingMode;
		let queueEntryId: string | null = null;
		let restaurantPlan: RestaurantPlan;

		const planCode = restaurantValidation.subscriptionPlanCode
			?.toUpperCase()
			.trim();

		if (planCode === RestaurantPlan.QUEUE_PRO) {
			restaurantPlan = RestaurantPlan.QUEUE_PRO;
			const activeQueue = await this.queueServiceClient.checkUserActiveQueue(
				cart.restaurantId,
				dto.userId,
			);

			if (
				!activeQueue?.hasActiveQueue ||
				!activeQueue.queueEntry?.queueEntryId
			) {
				throw new ActiveQueueEntryRequiredError();
			}

			queueEntryId = activeQueue.queueEntry.queueEntryId;
			orderingMode = OrderingMode.QUEUE_ORDER;
		} else if (planCode === RestaurantPlan.SELF_PRO) {
			restaurantPlan = RestaurantPlan.SELF_PRO;
			orderingMode = OrderingMode.SELF_ORDER;
		} else {
			throw new OrderingModeNotSupportedError(
				`Restaurant subscription plan '${restaurantValidation.subscriptionPlanCode ?? "NONE"}' does not support digital ordering`,
			);
		}

		const prepTimes: number[] = [];

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

				if (catalogItem.preparationTime && catalogItem.preparationTime > 0) {
					prepTimes.push(catalogItem.preparationTime);
				}

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

		const orderNumber = generateOrderNumber();
		const order = new Order({
			orderNumber,
			idempotencyKey: dto.idempotencyKey ?? null,
			restaurantId: cart.restaurantId,
			restaurantName: restaurantValidation.restaurantName,
			restaurantPlan,
			userId: dto.userId,
			userName: dto.userName ?? null,
			userPhone: dto.userPhone ?? null,
			queueEntryId,
			orderingMode,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			taxPercent: env.TAX_PERCENT,
			preparationTimes: prepTimes,
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

		const createdOrder = await this.orderRepository.create(order);

		let paymentDraft = null;
		try {
			const amountPaise = Math.round(createdOrder.grandTotal * 100);
			paymentDraft = await this.paymentServiceClient.createGatewayOrder({
				orderId: createdOrder.id,
				customerId: dto.userId,
				restaurantId: createdOrder.restaurantId,
				amountPaise,
				currency: "INR",
			});

			createdOrder.associatePayment(paymentDraft.paymentId);
			await this.orderRepository.updatePaymentReference(
				createdOrder.id,
				paymentDraft.paymentId,
			);

			await this.cartRepository.clearCart(cart.id);
		} catch (error) {
			// SAGA COMPENSATION (C1): Cancel order draft and retain cart items
			await this.orderRepository.updatePaymentAndOrderStatus(
				createdOrder.id,
				PaymentStatus.FAILED,
				OrderStatus.CANCELLED,
				"Payment gateway draft creation failed",
			);
			throw error;
		}

		return OrderResponseMapper.toDTO(createdOrder, paymentDraft);
	}
}
