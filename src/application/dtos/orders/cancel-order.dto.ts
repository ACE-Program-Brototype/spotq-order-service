export interface CancelOrderInputDto {
	orderId: string;
	customerId: string;
	cancellationReason?: string | null;
}

export interface CancelOrderResponseDto {
	order_id: string;
	order_number: string;
	status: string;
	cancellation_reason: string | null;
	cancelled_at: string;
}
