import { pinoHttp } from "pino-http";
import logger from "./pino.ts";

const httpLogger = pinoHttp({
	logger,
});

export default httpLogger;
