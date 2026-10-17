import "express";

export interface AuthenticatedUser {
	userId: string;
	role?: string | undefined;
	email?: string | undefined;
}

export interface AuthenticatedRestaurantAdmin {
	userId: string;
	restaurantId: string;
	role: string;
	email?: string | undefined;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthenticatedUser;
			restaurantAdmin?: AuthenticatedRestaurantAdmin;
		}
	}
}
