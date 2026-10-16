import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import type { CartItemProps } from "@domain/types/cart.types.ts";

export class CartItem {
	public readonly id: string;
	public readonly cartId: string;
	public readonly menuItemId: string;
	public readonly menuItemName?: string | undefined;
	public readonly variantId: string | null;
	public readonly variantName?: string | null;
	public readonly quantity: number;
	public readonly unitPrice: number;
	public readonly totalPrice: number;
	public readonly specialInstructions: string | null;
	public readonly addons: CartItemAddon[];
	public readonly createdAt: Date;
	public readonly updatedAt: Date;

	constructor(props: CartItemProps) {
		this.id = props.id;
		this.cartId = props.cartId;
		this.menuItemId = props.menuItemId;
		this.menuItemName = props.menuItemName;
		this.variantId = props.variantId ?? null;
		this.variantName = props.variantName ?? null;
		this.quantity = props.quantity;
		this.unitPrice = props.unitPrice ?? 0;
		this.specialInstructions = props.specialInstructions ?? null;
		this.addons = (props.addons ?? []).map((addon) => new CartItemAddon(addon));
		this.totalPrice = props.totalPrice ?? this.calculateLineTotal();
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();
	}

	public calculateLineTotal(): number {
		const addonsTotal = this.addons.reduce(
			(sum, addon) => sum + addon.price,
			0,
		);
		return Number(((this.unitPrice + addonsTotal) * this.quantity).toFixed(2));
	}

	public matchesConfiguration(
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
		specialInstructions?: string | null,
	): boolean {
		if (this.menuItemId !== menuItemId) {
			return false;
		}

		const thisVariant = this.variantId ?? null;
		const targetVariant = variantId ?? null;
		if (thisVariant !== targetVariant) {
			return false;
		}

		const thisInstructions = (this.specialInstructions ?? "").trim();
		const targetInstructions = (specialInstructions ?? "").trim();
		if (thisInstructions !== targetInstructions) {
			return false;
		}

		const thisAddonIds = this.addons
			.map((addon) => addon.addonId)
			.sort()
			.join(",");
		const targetAddonIds = [...(addonIds ?? [])].sort().join(",");

		return thisAddonIds === targetAddonIds;
	}
}

export default CartItem;
