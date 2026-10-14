export const ROUTES = {
	HEALTH: "/health",
	METRICS: "/metrics",
	CARTS: "/carts",
} as const;

export const CART_ROUTES = {
	ROOT: "/",
	BY_ID: "/:cartId",
	ITEMS: "/:cartId/items",
} as const;

export const RESTAURANT_SERVICE_ENDPOINTS = {
	CUSTOMER_MENU_ITEM: (restaurantId: string, menuItemId: string) =>
		`/api/v1/restaurants/customer/${restaurantId}/menu/items/${menuItemId}`,
} as const;

export default ROUTES;
