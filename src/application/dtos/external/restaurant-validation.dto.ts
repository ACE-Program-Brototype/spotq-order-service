export interface RestaurantValidationResultDto {
	restaurantId: string;
	restaurantName: string;
	verificationStatus: string;
	isBlocked: boolean;
	blockReason: string | null;
	isSubscriptionActive: boolean;
	subscriptionPlanCode: string | null;
	subscriptionEndsAt: string | null;
	canAccessQueueService: boolean;
}
