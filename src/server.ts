import app from "./app.js";
import env from "./config/env.js";
import logger from "./infrastructure/logger/pino.js";

app.listen(env.PORT, () => {
  logger.info(`Server running on ${env.PORT}`);
});