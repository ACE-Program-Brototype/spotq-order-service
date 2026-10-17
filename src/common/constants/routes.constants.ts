export const ROUTES = {
	HEALTH: "/health",
	METRICS: "/metrics",
	CARTS: "/carts",
	RESTAURANTS: "/restaurants",
} as const;

export const CART_ROUTES = {
	ROOT: "/",
	BY_ID: "/:cartId",
} as const;

export const RESTAURANT_ORDER_ROUTES = {
	OVERVIEW: "/:restaurantId/overview",
} as const;

export const RESTAURANT_SERVICE_ROUTES = {
	VALIDATION: (restaurantId: string) =>
		`/api/internal/v1/restaurants/${encodeURIComponent(restaurantId)}/validation`,
} as const;

export default ROUTES;
