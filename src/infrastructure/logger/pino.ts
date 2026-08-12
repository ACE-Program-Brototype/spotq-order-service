import env from "@config/env.ts";
import { pino } from "pino";

const logger = pino({
	level: env.LOG_LEVEL,
});

export default logger;
