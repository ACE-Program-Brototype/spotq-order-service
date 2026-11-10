import { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import type {
	AdminOrderListItemData,
	CancelledOrderData,
	CustomerOrderHistoryItemData,
	OrderOverviewItemData,
	RestaurantOrderListItemData,
	StaffOrderListItemData,
} from "@domain/types/order-repository.types.ts";
import type { Prisma } from "@generated/prisma/client.ts";

export interface PrismaOrderOverviewRecord {
	id: string;
	orderNumber: string;
	orderStatus: string;
	userId: string | null;
	grandTotal: Prisma.Decimal;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export interface PrismaCustomerOrderRecord {
	id: string;
	orderNumber: string;
	restaurantId: string;
	orderStatus: string;
	grandTotal: Prisma.Decimal;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export interface PrismaAdminOrderRecord {
	id: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName: string | null;
	userId: string | null;
	orderStatus: string;
	paymentStatus: string;
	grandTotal: Prisma.Decimal;
	platformFee: Prisma.Decimal;
	createdAt: Date;
	updatedAt: Date;
}

export interface PrismaCancelledOrderRecord {
	id: string;
	orderNumber: string;
	orderStatus: string;
	cancellationReason: string | null;
	cancelledAt: Date | null;
}

export type PrismaOrderWithRelations = Prisma.OrderGetPayload<{
	include: {
		items: {
			include: {
				addons: true;
			};
		};
		statusHistory: true;
	};
}>;

export interface PrismaRestaurantOrderRecord {
	id: string;
	orderNumber: string;
	orderStatus: string;
	grandTotal: Prisma.Decimal;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export interface PrismaStaffOrderItemAddonRecord {
	addonId: string;
	addonName: string;
}

export interface PrismaStaffOrderItemRecord {
	menuItemId: string;
	itemName: string;
	quantity: number;
	variantId: string | null;
	variantName: string | null;
	addons: PrismaStaffOrderItemAddonRecord[];
}

export interface PrismaStaffOrderRecord {
	id: string;
	orderNumber: string;
	restaurantPlan: string | null;
	orderStatus: string;
	createdAt: Date;
	queueEntryId: string | null;
	items: PrismaStaffOrderItemRecord[];
}

export const OrderPersistenceMapper = {
	toAdminOrderItem(record: PrismaAdminOrderRecord): AdminOrderListItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			restaurantId: record.restaurantId,
			restaurantName: record.restaurantName,
			customerId: record.userId,
			status: record.orderStatus as OrderStatus,
			paymentStatus: record.paymentStatus,
			totalAmount: Number(record.grandTotal.toFixed(2)),
			platformFeeAssessed: Number(record.platformFee.toFixed(2)),
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		};
	},

	toAdminOrderItemList(
		records: PrismaAdminOrderRecord[],
	): AdminOrderListItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toAdminOrderItem(record),
		);
	},
	toOverviewItem(record: PrismaOrderOverviewRecord): OrderOverviewItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			orderStatus: record.orderStatus,
			userId: record.userId,
			grandTotal: Number(record.grandTotal.toFixed(2)),
			itemsCount: record._count.items,
			createdAt: record.createdAt,
		};
	},

	toOverviewItemList(
		records: PrismaOrderOverviewRecord[],
	): OrderOverviewItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toOverviewItem(record),
		);
	},

	toCustomerOrderItem(
		record: PrismaCustomerOrderRecord,
	): CustomerOrderHistoryItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			restaurantId: record.restaurantId,
			orderStatus: record.orderStatus,
			grandTotal: Number(record.grandTotal.toFixed(2)),
			itemsCount: record._count.items,
			createdAt: record.createdAt,
		};
	},

	toRestaurantOrderItem(
		record: PrismaRestaurantOrderRecord,
	): RestaurantOrderListItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			orderStatus: record.orderStatus,
			itemsCount: record._count.items,
			grandTotal: Number(record.grandTotal.toFixed(2)),
			createdAt: record.createdAt,
		};
	},

	toRestaurantOrderItemList(
		records: PrismaRestaurantOrderRecord[],
	): RestaurantOrderListItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toRestaurantOrderItem(record),
		);
	},

	toCustomerOrderItemList(
		records: PrismaCustomerOrderRecord[],
	): CustomerOrderHistoryItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toCustomerOrderItem(record),
		);
	},

	toStaffOrderItem(record: PrismaStaffOrderRecord): StaffOrderListItemData {
		return {
			id: record.id,
			orderNumber: record.orderNumber,
			orderType: record.restaurantPlan as RestaurantPlan,
			status: record.orderStatus as OrderStatus,
			createdAt: record.createdAt,
			queueEntryId: record.queueEntryId,
			items: record.items.map((item) => ({
				menuItemId: item.menuItemId,
				name: item.itemName,
				quantity: item.quantity,
				variantId: item.variantId,
				variantName: item.variantName,
				addons: item.addons.map((addon) => ({
					id: addon.addonId,
					name: addon.addonName,
				})),
			})),
		};
	},

	toStaffOrderItemList(
		records: PrismaStaffOrderRecord[],
	): StaffOrderListItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toStaffOrderItem(record),
		);
	},

	toCancelledOrder(record: PrismaCancelledOrderRecord): CancelledOrderData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			status: record.orderStatus,
			cancellationReason: record.cancellationReason,
			cancelledAt: record.cancelledAt,
		};
	},

	toDomain(record: PrismaOrderWithRelations): Order {
		return new Order({
			id: record.id,
			orderNumber: record.orderNumber,
			idempotencyKey: record.idempotencyKey,
			restaurantId: record.restaurantId,
			restaurantName: record.restaurantName,
			restaurantPlan: (record.restaurantPlan as RestaurantPlan) ?? null,
			userId: record.userId,
			userName: record.userName,
			userPhone: record.userPhone,
			tableNumber: record.tableNumber,
			queueEntryId: record.queueEntryId,
			paymentId: record.paymentId,
			orderingMode: record.orderingMode as OrderingMode,
			paymentMode: record.paymentMode as PaymentMode,
			paymentStatus: record.paymentStatus as PaymentStatus,
			orderStatus: record.orderStatus as OrderStatus,
			subtotal: Number(record.subtotal),
			taxAmount: Number(record.taxAmount),
			platformFee: Number(record.platformFee),
			discountAmount: Number(record.discountAmount),
			grandTotal: Number(record.grandTotal),
			estimatedReadyAt: record.estimatedReadyAt,
			specialInstructions: record.specialInstructions,
			cancellationReason: record.cancellationReason,
			cancelledAt: record.cancelledAt,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			items: (record.items ?? []).map((item) => ({
				id: item.id,
				orderId: item.orderId,
				menuItemId: item.menuItemId,
				itemName: item.itemName,
				variantId: item.variantId,
				variantName: item.variantName,
				quantity: item.quantity,
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
				specialInstructions: item.specialInstructions,
				createdAt: item.createdAt,
				addons: (item.addons ?? []).map((addon) => ({
					id: addon.id,
					orderItemId: addon.orderItemId,
					addonId: addon.addonId,
					addonName: addon.addonName,
					price: Number(addon.price),
				})),
			})),
			statusHistory: (record.statusHistory ?? []).map((history) => ({
				id: history.id,
				orderId: history.orderId,
				previousStatus: history.previousStatus as OrderStatus | null,
				currentStatus: history.currentStatus as OrderStatus,
				changedBy: history.changedBy,
				notes: history.notes,
				createdAt: history.createdAt,
			})),
		});
	},
};
