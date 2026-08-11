import logger from "@infrastructure/logger/pino.js";
import redisConnection from "./redis.js";

export const connectRedis = async (): Promise<void> => {

  await redisConnection.ping()
  logger.info("Connected to Redis Cloud");
};

export const disconnectRedis = async (): Promise<void> => {
    
  await redisConnection.quit();
  logger.info("Redis disconnected");
};