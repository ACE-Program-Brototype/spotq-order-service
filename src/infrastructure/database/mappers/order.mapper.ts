import { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderType } from "@domain/enums/order-type.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type {
	CancelledOrderData,
	CustomerOrderHistoryItemData,
	OrderOverviewItemData,
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

export const OrderPersistenceMapper = {
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

	toCustomerOrderItemList(
		records: PrismaCustomerOrderRecord[],
	): CustomerOrderHistoryItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toCustomerOrderItem(record),
		);
	},

	toCancelledOrder(record: PrismaCancelledOrderRecord): CancelledOrderData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			status: record.orderStatus,
			cancellationReason: record.cancellationReason,
			cancelledAt: record.cancelledAt as Date,
		};
	},

	toDomain(record: PrismaOrderWithRelations): Order {
		return new Order({
			id: record.id,
			orderNumber: record.orderNumber,
			restaurantId: record.restaurantId,
			restaurantName: record.restaurantName,
			userId: record.userId,
			userName: record.userName,
			userPhone: record.userPhone,
			tableId: record.tableId,
			tableNumber: record.tableNumber,
			queueEntryId: record.queueEntryId,
			paymentId: record.paymentId,
			priority: record.priority,
			orderType: record.orderType as OrderType,
			paymentMode: record.paymentMode as PaymentMode,
			paymentStatus: record.paymentStatus as PaymentStatus,
			orderStatus: record.orderStatus as OrderStatus,
			subtotal: Number(record.subtotal),
			taxAmount: Number(record.taxAmount),
			platformFee: Number(record.platformFee),
			discountAmount: Number(record.discountAmount),
			couponCode: record.couponCode,
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
