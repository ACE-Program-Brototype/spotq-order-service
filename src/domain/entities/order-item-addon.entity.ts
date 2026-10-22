export interface OrderItemAddonProps {
	id?: string;
	orderItemId?: string | null | undefined;
	addonId: string;
	addonName: string;
	price: number;
}

export class OrderItemAddon {
	public readonly id: string;
	public readonly orderItemId: string | null;
	public readonly addonId: string;
	public readonly addonName: string;
	public readonly price: number;

	constructor(props: OrderItemAddonProps) {
		this.id = props.id ?? crypto.randomUUID();
		this.orderItemId = props.orderItemId ?? null;
		this.addonId = props.addonId;
		this.addonName = props.addonName;
		this.price = props.price;
	}
}

export default OrderItemAddon;
