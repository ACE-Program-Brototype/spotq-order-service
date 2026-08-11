import STATUS from "@common/constants/http.constant.js";
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
		status: "healthy",
	});
});

export default healthRouter;
