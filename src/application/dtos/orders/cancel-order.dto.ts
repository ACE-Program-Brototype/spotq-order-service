export interface CancelOrderInputDTO {
	orderId: string;
	customerId: string;
	cancellationReason?: string | null;
}

export interface CancelOrderResponseDTO {
	order_id: string;
	order_number: string;
	status: string;
	cancellation_reason: string | null;
	cancelled_at: string;
}
