import {
	CheckoutItemAddon,
	type CheckoutItemAddonProps,
} from "@domain/entities/checkout-item-addon.entity.ts";

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
	private readonly _addons: CheckoutItemAddon[];
	private readonly _lineTotal: number;

	constructor(private readonly props: CheckoutItemProps) {
		this._addons = (props.addons ?? []).map(
			(addon) => new CheckoutItemAddon(addon),
		);
		this._lineTotal = props.lineTotal ?? this.calculateLineTotal();
	}

	get cartItemId(): string {
		return this.props.cartItemId;
	}

	get menuItemId(): string {
		return this.props.menuItemId;
	}

	get name(): string {
		return this.props.name;
	}

	get variantId(): string | null {
		return this.props.variantId ?? null;
	}

	get variantName(): string | null {
		return this.props.variantName ?? null;
	}

	get quantity(): number {
		return this.props.quantity;
	}

	get unitPrice(): number {
		return this.props.unitPrice;
	}

	get specialInstructions(): string | null {
		return this.props.specialInstructions ?? null;
	}

	get addons(): CheckoutItemAddon[] {
		return this._addons;
	}

	get lineTotal(): number {
		return this._lineTotal;
	}

	public calculateLineTotal(): number {
		const addonsTotal = this._addons.reduce((sum, a) => sum + a.price, 0);
		return Number(((this.unitPrice + addonsTotal) * this.quantity).toFixed(2));
	}
}
