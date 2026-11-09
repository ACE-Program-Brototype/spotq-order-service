export interface GetCustomerOrderDetailsInputDTO {
	customerId: string;
	orderId: string;
}

export interface CustomerOrderItemVariantDTO {
	variant_id: string;
	name: string;
}

export interface CustomerOrderItemAddonDTO {
	addon_id: string;
	name: string;
	price: number;
}

export interface CustomerOrderItemDTO {
	menu_item_id: string;
	name: string;
	quantity: number;
	unit_price: number;
	variant: CustomerOrderItemVariantDTO | null;
	addons: CustomerOrderItemAddonDTO[];
	line_total: number;
}

export interface CustomerOrderRestaurantDTO {
	restaurant_id: string;
	name: string | null;
}

export interface CustomerOrderPricingDTO {
	subtotal: number;
	discounts: number;
	taxes: number;
	platform_fee: number;
	grand_total: number;
	currency: string;
}

export interface CustomerOrderDetailsDTO {
	order_id: string;
	order_number: string;
	restaurant: CustomerOrderRestaurantDTO;
	order_type: string;
	status: string;
	created_at: string;
	updated_at: string;
	table_number?: number | null;
	queue_entry_id?: string | null;
	special_instructions?: string | null;
	items: CustomerOrderItemDTO[];
	pricing: CustomerOrderPricingDTO;
}

export interface GetCustomerOrderDetailsOutputDTO {
	order: CustomerOrderDetailsDTO;
}
