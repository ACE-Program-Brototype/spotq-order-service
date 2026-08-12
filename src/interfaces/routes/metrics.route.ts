import prometheusClient from "@infrastructure/metrics/prom-client.ts";
import { Router } from "express";

const metricsRouter: Router = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get Prometheus metrics
 *     description: Returns application metrics in Prometheus exposition format.
 *     tags:
 *       - Metrics
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to retrieve metrics
 */

metricsRouter.get("/", async (_req, res) => {
	res.set("Content-Type", prometheusClient.register.contentType);
	res.end(await prometheusClient.register.metrics());
});

export default metricsRouter;
