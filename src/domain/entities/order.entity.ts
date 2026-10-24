import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderType } from "@domain/enums/order-type.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import {
	ForbiddenOrderAccessError,
	OrderCancellationNotAllowedError,
} from "@domain/errors/index.ts";
import { OrderItem, type OrderItemProps } from "./order-item.entity.ts";
import {
	OrderStatusHistory,
	type OrderStatusHistoryProps,
} from "./order-status-history.entity.ts";

export interface OrderProps {
	id?: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName?: string | null;
	userId?: string | null;
	userName?: string | null;
	userPhone?: string | null;
	tableId?: string | null;
	tableNumber?: number | null;
	queueEntryId?: string | null;
	paymentId?: string | null;
	priority?: number;
	orderType: OrderType;
	paymentMode: PaymentMode;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	subtotal?: number;
	taxAmount?: number;
	platformFee?: number;
	discountAmount?: number;
	couponCode?: string | null;
	grandTotal?: number;
	estimatedReadyAt?: Date | null;
	specialInstructions?: string | null;
	cancellationReason?: string | null;
	cancelledAt?: Date | null;
	items: OrderItemProps[];
	statusHistory?: OrderStatusHistoryProps[];
	createdAt?: Date;
	updatedAt?: Date;
}

export class Order {
	public readonly id: string;
	public readonly orderNumber: string;
	public readonly restaurantId: string;
	public readonly restaurantName: string | null;
	public readonly userId: string | null;
	public readonly userName: string | null;
	public readonly userPhone: string | null;
	public readonly tableId: string | null;
	public readonly tableNumber: number | null;
	public readonly queueEntryId: string | null;
	public readonly paymentId: string | null;
	public readonly priority: number;
	public readonly orderType: OrderType;
	public readonly paymentMode: PaymentMode;
	public readonly paymentStatus: PaymentStatus;
	private _orderStatus: OrderStatus;
	public readonly subtotal: number;
	public readonly taxAmount: number;
	public readonly platformFee: number;
	public readonly discountAmount: number;
	public readonly couponCode: string | null;
	public readonly grandTotal: number;
	public readonly estimatedReadyAt: Date | null;
	public readonly specialInstructions: string | null;
	private _cancellationReason: string | null;
	private _cancelledAt: Date | null;
	public readonly items: OrderItem[];
	public readonly statusHistory: OrderStatusHistory[];
	public readonly createdAt: Date;
	public readonly updatedAt: Date;

	public get orderStatus(): OrderStatus {
		return this._orderStatus;
	}

	public get cancellationReason(): string | null {
		return this._cancellationReason;
	}

	public get cancelledAt(): Date | null {
		return this._cancelledAt;
	}

	constructor(props: OrderProps) {
		this.id = props.id ?? crypto.randomUUID();
		this.orderNumber = props.orderNumber;
		this.restaurantId = props.restaurantId;
		this.restaurantName = props.restaurantName ?? null;
		this.userId = props.userId ?? null;
		this.userName = props.userName ?? null;
		this.userPhone = props.userPhone ?? null;
		this.tableId = props.tableId ?? null;
		this.tableNumber = props.tableNumber ?? null;
		this.queueEntryId = props.queueEntryId ?? null;
		this.paymentId = props.paymentId ?? null;
		this.priority = props.priority ?? 2;
		this.orderType = props.orderType;
		this.paymentMode = props.paymentMode;
		this.paymentStatus = props.paymentStatus;
		this._orderStatus = props.orderStatus;
		this.items = (props.items ?? []).map((item) => new OrderItem(item));
		this.statusHistory = (props.statusHistory ?? []).map(
			(history) => new OrderStatusHistory(history),
		);
		this.taxAmount = props.taxAmount ?? 0;
		this.platformFee = props.platformFee ?? 0;
		this.discountAmount = props.discountAmount ?? 0;
		this.couponCode = props.couponCode ?? null;
		this.subtotal = props.subtotal ?? this.calculateSubtotal();
		this.grandTotal = props.grandTotal ?? this.calculateGrandTotal();
		this.estimatedReadyAt = props.estimatedReadyAt ?? null;
		this.specialInstructions = props.specialInstructions ?? null;
		this._cancellationReason = props.cancellationReason ?? null;
		this._cancelledAt = props.cancelledAt ?? null;
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();

		this.validateItemsExist();
	}

	public calculateSubtotal(): number {
		const total = this.items.reduce(
			(sum, item) => sum + item.calculateLineTotal(),
			0,
		);
		return Number(total.toFixed(2));
	}

	public calculateGrandTotal(): number {
		const total =
			this.subtotal + this.taxAmount + this.platformFee - this.discountAmount;
		return Number(Math.max(0, total).toFixed(2));
	}

	public validateItemsExist(): void {
		if (this.items.length === 0) {
			throw new CartEmptyError();
		}
	}

	public cancel(customerId: string, reason?: string | null): void {
		if (this.userId !== customerId) {
			throw new ForbiddenOrderAccessError(
				ORDER_MESSAGES.ORDER_FORBIDDEN_CANCEL,
			);
		}

		if (this._orderStatus === OrderStatus.CANCELLED) {
			throw new OrderCancellationNotAllowedError(
				ORDER_MESSAGES.ORDER_ALREADY_CANCELLED,
			);
		}

		const nonCancellableStatuses = [
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
			OrderStatus.COMPLETED,
		];

		if (nonCancellableStatuses.includes(this._orderStatus)) {
			throw new OrderCancellationNotAllowedError(
				ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION,
			);
		}

		this._orderStatus = OrderStatus.CANCELLED;
		this._cancellationReason = reason ?? null;
		this._cancelledAt = new Date();
	}
}
