import { Router } from "express";
import prometheusClient from "@infrastructure/metrics/prom-client.js";

const metricsRouter:Router = Router();

metricsRouter.get("/", async (_req, res) => {

  res.set("Content-Type", prometheusClient.register.contentType);
  res.end(await prometheusClient.register.metrics());
  
});

export default metricsRouter;