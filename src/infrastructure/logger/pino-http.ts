import { pinoHttp } from "pino-http";
import logger from "./pino.js";

const httpLogger = pinoHttp({
    logger
});

export default httpLogger;