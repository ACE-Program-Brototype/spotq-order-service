import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";

export interface CheckoutItemAddonProps {
	addonId: string;
	name: string;
	price: number;
}

export class CheckoutItemAddon {
	public readonly addonId: string;
	public readonly name: string;
	public readonly price: number;

	constructor(props: CheckoutItemAddonProps) {
		this.addonId = props.addonId;
		this.name = props.name;
		this.price = props.price;
	}
}

export interface CheckoutItemProps {
	cartItemId: string;
	menuItemId: string;
	name: string;
	variantId?: string | null;
	variantName?: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal?: number;
	specialInstructions?: string | null;
	addons?: CheckoutItemAddonProps[];
}

export class CheckoutItem {
	public readonly cartItemId: string;
	public readonly menuItemId: string;
	public readonly name: string;
	public readonly variantId: string | null;
	public readonly variantName: string | null;
	public readonly quantity: number;
	public readonly unitPrice: number;
	public readonly lineTotal: number;
	public readonly specialInstructions: string | null;
	public readonly addons: CheckoutItemAddon[];

	constructor(props: CheckoutItemProps) {
		this.cartItemId = props.cartItemId;
		this.menuItemId = props.menuItemId;
		this.name = props.name;
		this.variantId = props.variantId ?? null;
		this.variantName = props.variantName ?? null;
		this.quantity = props.quantity;
		this.unitPrice = props.unitPrice;
		this.specialInstructions = props.specialInstructions ?? null;
		this.addons = (props.addons ?? []).map(
			(addon) => new CheckoutItemAddon(addon),
		);
		this.lineTotal = props.lineTotal ?? this.calculateLineTotal();
	}

	public calculateLineTotal(): number {
		const addonsTotal = this.addons.reduce((sum, a) => sum + a.price, 0);
		return Number(((this.unitPrice + addonsTotal) * this.quantity).toFixed(2));
	}
}

export interface CheckoutDetailsProps {
	cartId: string;
	restaurantId: string;
	restaurantName: string;
	items: CheckoutItemProps[];
	taxPercent: number;
}

export class CheckoutDetails {
	public readonly cartId: string;
	public readonly restaurantId: string;
	public readonly restaurantName: string;
	public readonly items: CheckoutItem[];
	public readonly taxPercent: number;
	public readonly itemCount: number;
	public readonly subtotal: number;
	public readonly taxAmount: number;
	public readonly totalAmount: number;

	constructor(props: CheckoutDetailsProps) {
		if (props.taxPercent < 0) {
			throw new Error("Tax percent cannot be negative");
		}

		this.cartId = props.cartId;
		this.restaurantId = props.restaurantId;
		this.restaurantName = props.restaurantName;
		this.taxPercent = Number(props.taxPercent.toFixed(2));
		this.items = (props.items ?? []).map((item) => new CheckoutItem(item));

		this.validateItemsExist();

		this.itemCount = this.calculateItemCount();
		this.subtotal = this.calculateSubtotal();
		this.taxAmount = this.calculateTaxAmount();
		this.totalAmount = this.calculateTotalAmount();
	}

	public validateItemsExist(): void {
		if (this.items.length === 0) {
			throw new CartEmptyError();
		}
	}

	public calculateItemCount(): number {
		return this.items.reduce((sum, item) => sum + item.quantity, 0);
	}

	public calculateSubtotal(): number {
		const total = this.items.reduce((sum, item) => sum + item.lineTotal, 0);
		return Number(total.toFixed(2));
	}

	public calculateTaxAmount(): number {
		const tax = (this.subtotal * this.taxPercent) / 100;
		return Number(tax.toFixed(2));
	}

	public calculateTotalAmount(): number {
		const total = this.subtotal + this.taxAmount;
		return Number(total.toFixed(2));
	}
}
