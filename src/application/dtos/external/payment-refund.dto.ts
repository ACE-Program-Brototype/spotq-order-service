export interface ProcessPaymentRefundInputDTO {
	orderId: string;
	amountPaise?: number | undefined;
	reason?: string | undefined;
	notes?: string | undefined;
	idempotencyKey: string;
}

export interface ProcessPaymentRefundResponseDTO {
	refundId: string;
	transactionId?: string | undefined;
	orderId: string;
	amountPaise?: number | undefined;
	currency?: string | undefined;
	status: string;
	processedAt?: string | undefined;
}
