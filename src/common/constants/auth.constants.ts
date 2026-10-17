export const AUTH_HEADERS = {
	USER_ID: "x-user-id",
	RESTAURANT_ID: "x-restaurant-id",
	USER_ROLE: "x-user-role",
	USER_EMAIL: "x-user-email",
	AUTHORIZATION: "authorization",
} as const;

export const AUTH_CONSTANTS = {
	BEARER_PREFIX: "Bearer ",
	BEARER_PREFIX_LENGTH: 7,
} as const;

export default AUTH_CONSTANTS;
