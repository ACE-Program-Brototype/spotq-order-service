import {
	ALLOWED_STATUS_TRANSITIONS,
	ORDER_DOMAIN_MESSAGES,
} from "@domain/constants/order.constants.ts";
import {
	OrderItem,
	type OrderItemProps,
} from "@domain/entities/order-item.entity.ts";
import {
	OrderStatusHistory,
	type OrderStatusHistoryProps,
} from "@domain/entities/order-status-history.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import { CartEmptyError } from "@domain/errors/cart.errors.ts";
import {
	ActiveQueueEntryRequiredError,
	ForbiddenOrderAccessError,
	ForbiddenRestaurantAccessError,
	InvalidOrderStatusTransitionError,
	OrderCancellationNotAllowedError,
} from "@domain/errors/index.ts";

export interface OrderProps {
	id?: string;
	orderNumber: string;
	idempotencyKey?: string | null;
	restaurantId: string;
	restaurantName?: string | null;
	restaurantPlan?: RestaurantPlan | null;
	userId?: string | null;
	userName?: string | null;
	userPhone?: string | null;
	tableNumber?: number | null;
	queueEntryId?: string | null;
	paymentId?: string | null;
	orderingMode: OrderingMode;
	paymentMode: PaymentMode;
	paymentStatus?: PaymentStatus;
	orderStatus?: OrderStatus;
	subtotal?: number;
	taxPercent?: number;
	taxAmount?: number;
	platformFee?: number;
	discountAmount?: number;
	grandTotal?: number;
	preparationTimes?: number[];
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
	public readonly idempotencyKey: string | null;
	public readonly restaurantId: string;
	public readonly restaurantName: string | null;
	public readonly restaurantPlan: RestaurantPlan | null;
	public readonly userId: string | null;
	public readonly userName: string | null;
	public readonly userPhone: string | null;
	public readonly tableNumber: number | null;
	public readonly queueEntryId: string | null;
	private currentPaymentId: string | null;
	public readonly orderingMode: OrderingMode;
	public readonly paymentMode: PaymentMode;
	private currentPaymentStatus: PaymentStatus;
	private currentStatus: OrderStatus;
	public readonly subtotal: number;
	public readonly taxAmount: number;
	public readonly platformFee: number;
	public readonly discountAmount: number;
	public readonly grandTotal: number;
	public readonly estimatedReadyAt: Date | null;
	public readonly specialInstructions: string | null;
	private currentCancellationReason: string | null;
	private currentCancelledAt: Date | null;
	public readonly items: OrderItem[];
	public readonly statusHistory: OrderStatusHistory[];
	public readonly createdAt: Date;
	public readonly updatedAt: Date;

	public get orderStatus(): OrderStatus {
		return this.currentStatus;
	}

	public get paymentStatus(): PaymentStatus {
		return this.currentPaymentStatus;
	}

	public get paymentId(): string | null {
		return this.currentPaymentId;
	}

	public get cancellationReason(): string | null {
		return this.currentCancellationReason;
	}

	public get cancelledAt(): Date | null {
		return this.currentCancelledAt;
	}

	constructor(props: OrderProps) {
		this.id = props.id ?? crypto.randomUUID();
		this.orderNumber = props.orderNumber;
		this.idempotencyKey = props.idempotencyKey ?? null;
		this.restaurantId = props.restaurantId;
		this.restaurantName = props.restaurantName ?? null;
		this.restaurantPlan = props.restaurantPlan ?? null;
		this.userId = props.userId ?? null;
		this.userName = props.userName ?? null;
		this.userPhone = props.userPhone ?? null;
		this.tableNumber = props.tableNumber ?? null;
		this.queueEntryId = props.queueEntryId ?? null;
		this.currentPaymentId = props.paymentId ?? null;
		this.orderingMode = props.orderingMode;
		this.paymentMode = props.paymentMode ?? PaymentMode.ONLINE;
		this.currentPaymentStatus = props.paymentStatus ?? PaymentStatus.PENDING;
		this.currentStatus = props.orderStatus ?? OrderStatus.PLACED;
		this.items = (props.items ?? []).map((item) => new OrderItem(item));
		this.statusHistory = (props.statusHistory ?? []).map(
			(history) => new OrderStatusHistory(history),
		);

		this.validateItemsExist();
		this.validateModeInvariants();

		// Domain calculations
		this.subtotal = props.subtotal ?? this.calculateSubtotal();
		this.taxAmount =
			props.taxAmount ??
			(props.taxPercent !== undefined
				? this.calculateTaxAmount(props.taxPercent)
				: 0);
		this.platformFee = props.platformFee ?? 0;
		this.discountAmount = props.discountAmount ?? 0;
		this.grandTotal = props.grandTotal ?? this.calculateGrandTotal();
		this.estimatedReadyAt =
			props.estimatedReadyAt !== undefined
				? props.estimatedReadyAt
				: this.calculateEstimatedReadyAt(props.preparationTimes);

		this.specialInstructions = props.specialInstructions ?? null;
		this.currentCancellationReason = props.cancellationReason ?? null;
		this.currentCancelledAt = props.cancelledAt ?? null;
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();
	}

	public calculateSubtotal(): number {
		const total = this.items.reduce(
			(sum, item) => sum + item.calculateLineTotal(),
			0,
		);
		return Number(total.toFixed(2));
	}

	public calculateTaxAmount(taxPercent: number): number {
		const tax = (this.subtotal * taxPercent) / 100;
		return Number(tax.toFixed(2));
	}

	// --- Queries (CQS) ---
	public calculateGrandTotal(): number {
		const total =
			this.subtotal + this.taxAmount + this.platformFee - this.discountAmount;
		return Number(Math.max(0, total).toFixed(2));
	}

	public calculateEstimatedReadyAt(prepTimes?: number[]): Date | null {
		const validTimes = (prepTimes ?? []).filter((time) => time > 0);
		if (validTimes.length === 0) {
			return null;
		}
		const avgPrepMinutes = Math.round(
			validTimes.reduce((acc, t) => acc + t, 0) / validTimes.length,
		);
		return new Date(Date.now() + avgPrepMinutes * 60 * 1000);
	}

	public validateItemsExist(): void {
		if (this.items.length === 0) {
			throw new CartEmptyError();
		}
	}

	public validateModeInvariants(): void {
		if (this.orderingMode === OrderingMode.QUEUE_ORDER && !this.queueEntryId) {
			throw new ActiveQueueEntryRequiredError();
		}
	}

	public associatePayment(paymentId: string): void {
		this.currentPaymentId = paymentId;
	}

	public markAsPaid(paymentId?: string): void {
		if (paymentId) {
			this.currentPaymentId = paymentId;
		}
		this.currentPaymentStatus = PaymentStatus.PAID;
		this.currentStatus = OrderStatus.CONFIRMED;
	}

	public markPaymentFailed(reason?: string): void {
		this.currentPaymentStatus = PaymentStatus.FAILED;
		this.currentStatus = OrderStatus.CANCELLED;
		this.currentCancellationReason = reason ?? "Payment failed";
		this.currentCancelledAt = new Date();
	}

	public validateCustomerAccess(customerId: string): void {
		if (this.userId !== customerId) {
			throw new ForbiddenOrderAccessError(
				ORDER_DOMAIN_MESSAGES.ORDER_FORBIDDEN_CANCEL,
			);
		}
	}

	public validateRestaurantAccess(restaurantId: string): void {
		if (this.restaurantId !== restaurantId) {
			throw new ForbiddenRestaurantAccessError(
				ORDER_DOMAIN_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS,
			);
		}
	}

	public canTransitionTo(newStatus: OrderStatus): boolean {
		const allowedTransitions =
			ALLOWED_STATUS_TRANSITIONS[this.currentStatus] ?? [];
		return allowedTransitions.includes(newStatus);
	}

	public cancel(customerId: string, reason?: string | null): void {
		this.validateCustomerAccess(customerId);

		if (this.currentStatus === OrderStatus.CANCELLED) {
			throw new OrderCancellationNotAllowedError(
				ORDER_DOMAIN_MESSAGES.ORDER_ALREADY_CANCELLED,
			);
		}

		const nonCancellableStatuses = [
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
			OrderStatus.COMPLETED,
		];

		if (nonCancellableStatuses.includes(this.currentStatus)) {
			throw new OrderCancellationNotAllowedError(
				ORDER_DOMAIN_MESSAGES.ORDER_ALREADY_IN_PREPARATION,
			);
		}

		this.currentStatus = OrderStatus.CANCELLED;
		this.currentCancellationReason = reason ?? null;
		this.currentCancelledAt = new Date();
	}

	public updateStatus(newStatus: OrderStatus, restaurantId?: string): void {
		if (restaurantId) {
			this.validateRestaurantAccess(restaurantId);
		}

		if (!this.canTransitionTo(newStatus)) {
			throw new InvalidOrderStatusTransitionError(
				ORDER_DOMAIN_MESSAGES.INVALID_STATUS_TRANSITION_TEMPLATE(
					this.currentStatus,
					newStatus,
				),
			);
		}

		this.currentStatus = newStatus;
		if (newStatus === OrderStatus.CANCELLED && !this.currentCancelledAt) {
			this.currentCancelledAt = new Date();
		}
	}
}
