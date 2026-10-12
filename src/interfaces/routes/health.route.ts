import { HEALTH_STATUS } from "@common/constants/health-status.constants.ts";
import { STATUS } from "@common/constants/http.constants.ts";
import express, { type Router } from "express";

const healthRouter: Router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 */

healthRouter.get("/", (_req, res) => {
	return res.status(STATUS.SUCCESS.OK).json({
		success: true,
		status: HEALTH_STATUS.HEALTHY,
	});
});

export default healthRouter;
