import type { NextFunction, Request, Response } from "express";

export interface IInternalOrderAnalyticsController {
	getRestaurantOrderSummary(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void>;
	getRestaurantProductAnalytics(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void>;
}
