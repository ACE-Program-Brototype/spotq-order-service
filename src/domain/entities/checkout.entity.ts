import {
	CheckoutItem,
	type CheckoutItemProps,
} from "@domain/entities/checkout-item.entity.ts";
import {
	CheckoutItemAddon,
	type CheckoutItemAddonProps,
} from "@domain/entities/checkout-item-addon.entity.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { InvalidTaxPercentError } from "@domain/errors/invalid-tax-percent.error.ts";

export {
	CheckoutItem,
	CheckoutItemAddon,
	type CheckoutItemAddonProps,
	type CheckoutItemProps,
};

export interface CheckoutDetailsProps {
	cartId: string;
	restaurantId: string;
	restaurantName: string;
	items: CheckoutItemProps[];
	taxPercent: number;
}

export class CheckoutDetails {
	private readonly _items: CheckoutItem[];
	private readonly _itemCount: number;
	private readonly _subtotal: number;
	private readonly _taxAmount: number;
	private readonly _totalAmount: number;

	constructor(private readonly props: CheckoutDetailsProps) {
		if (props.taxPercent < 0) {
			throw new InvalidTaxPercentError();
		}

		this._items = (props.items ?? []).map((item) => new CheckoutItem(item));

		this.validateItemsExist();

		this._itemCount = this.calculateItemCount();
		this._subtotal = this.calculateSubtotal();
		this._taxAmount = this.calculateTaxAmount();
		this._totalAmount = this.calculateTotalAmount();
	}

	get cartId(): string {
		return this.props.cartId;
	}

	get restaurantId(): string {
		return this.props.restaurantId;
	}

	get restaurantName(): string {
		return this.props.restaurantName;
	}

	get taxPercent(): number {
		return Number(this.props.taxPercent.toFixed(2));
	}

	get items(): CheckoutItem[] {
		return this._items;
	}

	get itemCount(): number {
		return this._itemCount;
	}

	get subtotal(): number {
		return this._subtotal;
	}

	get taxAmount(): number {
		return this._taxAmount;
	}

	get totalAmount(): number {
		return this._totalAmount;
	}

	public validateItemsExist(): void {
		if (this._items.length === 0) {
			throw new CartEmptyError();
		}
	}

	public calculateItemCount(): number {
		return this._items.reduce((sum, item) => sum + item.quantity, 0);
	}

	public calculateSubtotal(): number {
		const total = this._items.reduce((sum, item) => sum + item.lineTotal, 0);
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
