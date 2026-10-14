/**
 * Application Route Constants
 *
 * Centralized route paths for controllers, routers, and gateway forwarding.
 */

export const ROUTES = {
	HEALTH: "/health",
	METRICS: "/metrics",
	CARTS: "/carts",
} as const;

export const CART_ROUTES = {
	ROOT: "/",
	BY_ID: "/:cartId",
} as const;

export default ROUTES;
