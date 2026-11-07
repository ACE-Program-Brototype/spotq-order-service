export interface GetStaffOrderDetailsInputDTO {
	restaurantId: string;
	orderId: string;
}

export interface StaffOrderAddonDTO {
	addon_id: string;
	name: string;
}

export interface StaffOrderItemDTO {
	menu_item_id: string;
	name: string;
	variant_id: string | null;
	variant_name: string | null;
	addons: StaffOrderAddonDTO[];
	quantity: number;
	special_instructions: string | null;
}

export interface GetStaffOrderDetailsOutputDTO {
	order_id: string;
	order_number: string;
	status: string;
	customer_notes: string | null;
	items: StaffOrderItemDTO[];
	created_at: string;
}
