import {
	OrderItemAddon,
	type OrderItemAddonProps,
} from "./order-item-addon.entity.ts";

export interface OrderItemProps {
	id?: string;
	orderId?: string | null | undefined;
	menuItemId: string;
	itemName: string;
	variantId?: string | null | undefined;
	variantName?: string | null | undefined;
	quantity: number;
	unitPrice: number;
	totalPrice?: number;
	specialInstructions?: string | null | undefined;
	addons?: OrderItemAddonProps[];
	createdAt?: Date;
}

export class OrderItem {
	public readonly id: string;
	public readonly orderId: string | null;
	public readonly menuItemId: string;
	public readonly itemName: string;
	public readonly variantId: string | null;
	public readonly variantName: string | null;
	public readonly quantity: number;
	public readonly unitPrice: number;
	public readonly totalPrice: number;
	public readonly specialInstructions: string | null;
	public readonly addons: OrderItemAddon[];
	public readonly createdAt: Date;

	constructor(props: OrderItemProps) {
		this.id = props.id ?? crypto.randomUUID();
		this.orderId = props.orderId ?? null;
		this.menuItemId = props.menuItemId;
		this.itemName = props.itemName;
		this.variantId = props.variantId ?? null;
		this.variantName = props.variantName ?? null;
		this.quantity = props.quantity;
		this.unitPrice = props.unitPrice;
		this.specialInstructions = props.specialInstructions ?? null;
		this.addons = (props.addons ?? []).map(
			(addon) => new OrderItemAddon(addon),
		);
		this.totalPrice = props.totalPrice ?? this.calculateLineTotal();
		this.createdAt = props.createdAt ?? new Date();
	}

	public calculateLineTotal(): number {
		const addonsTotal = this.addons.reduce((sum, a) => sum + a.price, 0);
		return Number(((this.unitPrice + addonsTotal) * this.quantity).toFixed(2));
	}
}
