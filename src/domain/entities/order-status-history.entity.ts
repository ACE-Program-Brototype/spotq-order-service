import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface OrderStatusHistoryProps {
	id?: string;
	orderId?: string | null | undefined;
	previousStatus?: OrderStatus | null | undefined;
	currentStatus: OrderStatus;
	changedBy: string;
	notes?: string | null | undefined;
	createdAt?: Date;
}

export class OrderStatusHistory {
	public readonly id: string;
	public readonly orderId: string | null;
	public readonly previousStatus: OrderStatus | null;
	public readonly currentStatus: OrderStatus;
	public readonly changedBy: string;
	public readonly notes: string | null;
	public readonly createdAt: Date;

	constructor(props: OrderStatusHistoryProps) {
		this.id = props.id ?? crypto.randomUUID();
		this.orderId = props.orderId ?? null;
		this.previousStatus = props.previousStatus ?? null;
		this.currentStatus = props.currentStatus;
		this.changedBy = props.changedBy;
		this.notes = props.notes ?? null;
		this.createdAt = props.createdAt ?? new Date();
	}
}

export default OrderStatusHistory;
