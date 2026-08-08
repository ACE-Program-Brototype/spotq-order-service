import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import ROUTES from "./common/constants/api-routes.js";
import swaggerSpec from "./config/swagger.js";
import httpLogger from "./infrastructure/logger/pino-http.js";
import healthRouter from "./interfaces/routes/health.route.js";

const app: Express = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(httpLogger);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(ROUTES.HEALTH, healthRouter);

export default app;
