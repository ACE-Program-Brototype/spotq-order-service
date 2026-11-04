export interface CreateOrderPaymentInputDTO {
	orderId: string;
	customerId: string;
	restaurantId: string;
	amountPaise: number;
	currency?: string;
}

export interface CreateOrderPaymentResponseDTO {
	paymentId: string;
	orderId: string;
	razorpayOrderId: string;
	amountPaise: number;
	currency: string;
	keyId: string;
}
