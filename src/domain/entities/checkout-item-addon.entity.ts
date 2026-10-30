export interface CheckoutItemAddonProps {
	addonId: string;
	name: string;
	price: number;
}

export class CheckoutItemAddon {
	constructor(private readonly props: CheckoutItemAddonProps) {}

	get addonId(): string {
		return this.props.addonId;
	}

	get name(): string {
		return this.props.name;
	}

	get price(): number {
		return this.props.price;
	}
}
