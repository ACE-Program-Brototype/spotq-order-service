import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type { CartProps } from "@domain/types/cart.types.ts";

export class Cart {
	public readonly id: string;
	public readonly restaurantId: string;
	public readonly userId: string;
	public status: CartStatus;
	public readonly expiresAt: Date;
	public readonly items: CartItem[];
	public readonly createdAt: Date;
	public readonly updatedAt: Date;

	constructor(props: CartProps) {
		this.id = props.id;
		this.restaurantId = props.restaurantId;
		this.userId = props.userId;
		this.status = props.status;
		this.expiresAt = props.expiresAt;
		this.items = (props.items ?? []).map((item) => new CartItem(item));
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();
	}

	public isExpired(now: Date = new Date()): boolean {
		return (
			this.status === CartStatus.EXPIRED ||
			now.getTime() > this.expiresAt.getTime()
		);
	}

	public calculateSubtotal(): number {
		const total = this.items.reduce(
			(sum, item) => sum + item.calculateLineTotal(),
			0,
		);
		return Number(total.toFixed(2));
	}

	public calculateItemCount(): number {
		return this.items.reduce((sum, item) => sum + item.quantity, 0);
	}
}

export default Cart;
