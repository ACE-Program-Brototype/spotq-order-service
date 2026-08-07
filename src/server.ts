import app from "./app.js";
import env from "./config/env.js";
import prisma from "./infrastructure/database/prisma.js";
import logger from "./infrastructure/logger/pino.js";
import redisConnection from "./infrastructure/redis/redis.js";

async function startServer() {
    try {

        await prisma.$connect();
        logger.info("Connected to PostgreSQL");

        await redisConnection.ping();
        logger.info("Connected to Redis");

        app.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT}`);
        });

    } catch (error) {
      
        logger.fatal(error, "Failed to start Order Service");
        process.exit(1);
    }
}

startServer();