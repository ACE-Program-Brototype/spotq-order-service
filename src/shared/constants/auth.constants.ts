export const AUTH_HEADERS = {
	USER_ID: "x-user-id",
	RESTAURANT_ID: "x-restaurant-id",
	USER_ROLE: "x-user-role",
	USER_EMAIL: "x-user-email",
	USER_NAME: "x-user-name",
	USER_PHONE: "x-user-phone",
	AUTHORIZATION: "authorization",
} as const;

export const AUTH_ROLES = {
	RESTAURANT_OWNER: "RESTAURANT_OWNER",
	STAFF: "staff",
	CUSTOMER: "CUSTOMER",
} as const;

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export const AUTH_CONSTANTS = {
	BEARER_PREFIX: "Bearer ",
	BEARER_PREFIX_LENGTH: 7,
} as const;

export const S2S_CALLER_SERVICES = {
	RESTAURANT_SERVICE: "restaurant-service",
	USER_SERVICE: "user-service",
	PAYMENT_SERVICE: "payment-service",
	QUEUE_SERVICE: "queue-service",
	ORDER_SERVICE: "order-service",
} as const;

export type S2SCallerService =
	(typeof S2S_CALLER_SERVICES)[keyof typeof S2S_CALLER_SERVICES];
