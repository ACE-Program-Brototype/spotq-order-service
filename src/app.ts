import swaggerSpec from "@config/swagger.ts";
import httpLogger from "@infrastructure/logger/pino-http.ts";
import { errorHandler } from "@presentation/http/middleware/error.middleware.ts";
import { cartRouter } from "@presentation/http/routes/cart.route.ts";
import customerOrderRouter from "@presentation/http/routes/customer-order.route.ts";
import healthRouter from "@presentation/http/routes/health.route.ts";
import metricsRouter from "@presentation/http/routes/metrics.route.ts";
import restaurantOrderRouter from "@presentation/http/routes/restaurant-order.route.ts";
import ROUTES from "@shared/constants/routes.constants.ts";
import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

const app: Express = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(httpLogger);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(ROUTES.HEALTH, healthRouter);

app.use(ROUTES.METRICS, metricsRouter);

app.use(ROUTES.CARTS, cartRouter);

app.use(ROUTES.ROOT, customerOrderRouter);

app.use(ROUTES.RESTAURANTS, restaurantOrderRouter);

app.use(errorHandler);

export default app;
