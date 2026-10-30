import { pinoHttp } from "pino-http";
import logger from "./logger.ts";

const httpLogger = pinoHttp({
	logger,
});

export default httpLogger;
