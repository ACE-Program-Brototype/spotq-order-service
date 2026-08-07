import express,{ type Express} from "express";
import ROUTES from "./common/constants/api-routes.js";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import STATUS from "./common/constants/http-status.js";
import httpLogger from "./infrastructure/logger/pino-http.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app:Express = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json());

app.use(httpLogger);

app.use("/api/docs",swaggerUi.serve,swaggerUi.setup(swaggerSpec));

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

app.get(ROUTES.HEALTH , (req,res) => {

    return res.status(STATUS.SUCCESS.OK).json({ status: "healthy" });
    
});

export default app;

