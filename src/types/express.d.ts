import "express";

export interface AuthenticatedUser {
	userId: string;
	role?: string | undefined;
	email?: string | undefined;
	name?: string | undefined;
	phone?: string | undefined;
	restaurantId?: string | undefined;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthenticatedUser;
			callerService?: string;
		}
	}
}
