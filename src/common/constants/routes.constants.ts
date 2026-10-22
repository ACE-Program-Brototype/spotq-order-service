export const ROUTES = {
	ROOT: "/",
	HEALTH: "/health",
	METRICS: "/metrics",
	CARTS: "/carts",
	RESTAURANTS: "/restaurants",
	ORDERS: "/orders",
} as const;

export const ORDER_ROUTES = {
	PLACE: "/",
	HISTORY: "/history",
	CANCEL: "/:orderId/cancel",
} as const;

export const CART_ROUTES = {
	ROOT: "/",
	BY_ID: "/:cartId",
	ITEMS: "/items",
	ITEM_BY_ID: "/:cartId/items/:cartItemId",
} as const;

export const RESTAURANT_SERVICE_ENDPOINTS = {
	INTERNAL_MENU_ITEM: (restaurantId: string, menuItemId: string) =>
		`/api/internal/v1/restaurants/${restaurantId}/menu/items/${menuItemId}`,
	CUSTOMER_MENU_ITEM: (restaurantId: string, menuItemId: string) =>
		`/customer/${restaurantId}/menu/items/${menuItemId}`,
} as const;

export const RESTAURANT_ORDER_ROUTES = {
	OVERVIEW: "/:restaurantId/overview",
} as const;

export const RESTAURANT_SERVICE_ROUTES = {
	VALIDATION: (restaurantId: string) =>
		`/api/internal/v1/restaurants/${encodeURIComponent(restaurantId)}/validation`,
} as const;

export const QUEUE_SERVICE_ROUTES = {
	ACTIVE_USER_QUEUE: (restaurantId: string, userId: string) =>
		`/api/internal/v1/restaurants/${encodeURIComponent(restaurantId)}/queue/users/${encodeURIComponent(userId)}/active`,
} as const;

export default ROUTES;
