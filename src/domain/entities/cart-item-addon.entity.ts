import type { CartItemAddonProps } from "@domain/types/cart.types.ts";

export class CartItemAddon {
	public readonly id: string;
	public readonly cartItemId: string;
	public readonly addonId: string;
	public readonly addonName?: string | undefined;
	public readonly price: number;

	constructor(props: CartItemAddonProps) {
		this.id = props.id;
		this.cartItemId = props.cartItemId;
		this.addonId = props.addonId;
		this.addonName = props.addonName;
		this.price = props.price ?? 0;
	}
}

export default CartItemAddon;
