export const ROUTES = {
	ROOT: "/",
	HEALTH: "/health",
	METRICS: "/metrics",
	CARTS: "/carts",
	RESTAURANTS: "/restaurants",
	ORDERS: "/orders",
	STAFF: "/staff",
} as const;

export const STAFF_ORDER_ROUTES = {
	UPDATE_STATUS: "/:orderId/status",
	DETAILS: "/restaurants/:restaurantId/orders/:orderId",
	RESTAURANT_ORDERS: "/restaurants/:restaurantId/orders",
} as const;

export const ORDER_ROUTES = {
	PLACE: "/",
	HISTORY: "/history",
	CANCEL: "/:orderId/cancel",
	CHECKOUT: "/checkout",
	DETAILS: "/:orderId",
} as const;

export const CART_ROUTES = {
	ROOT: "/",
	BY_ID: "/:cartId",
	ITEMS: "/items",
	ITEMS_BATCH: "/items/batch",
	ITEM_BY_ID: "/:cartId/items/:cartItemId",
} as const;

export const RESTAURANT_SERVICE_ENDPOINTS = {
	INTERNAL_MENU_ITEM: (restaurantId: string, menuItemId: string) =>
		`/api/internal/v1/restaurants/${restaurantId}/menu/items/${menuItemId}`,
	CUSTOMER_MENU_ITEM: (restaurantId: string, menuItemId: string) =>
		`/customer/${restaurantId}/menu/items/${menuItemId}`,
} as const;

export const RESTAURANT_ORDER_ROUTES = {
	OVERVIEW: "/:restaurantId/orders/overview",
	LIST: "/:restaurantId/orders",
	DETAILS: "/:restaurantId/orders/:orderId",
} as const;

export const RESTAURANT_SERVICE_ROUTES = {
	VALIDATION: (restaurantId: string) =>
		`/api/internal/v1/restaurants/${encodeURIComponent(restaurantId)}/validation`,
} as const;

export const QUEUE_SERVICE_ROUTES = {
	ACTIVE_USER_QUEUE: (restaurantId: string, userId: string) =>
		`/api/internal/v1/restaurants/${encodeURIComponent(restaurantId)}/queue/users/${encodeURIComponent(userId)}/active`,
} as const;

export const PAYMENT_SERVICE_ROUTES = {
	CREATE_GATEWAY_ORDER: "/api/internal/v1/payments/orders",
	PROCESS_REFUND: "/api/internal/v1/payments/refunds",
	ORDER_STATUS: (orderId: string) =>
		`/orders/${encodeURIComponent(orderId)}/status`,
} as const;

export default ROUTES;
