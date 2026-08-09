import redisConnection from "@infrastructure/redis/redis.js";

export const bullMQConfig = {
  connection: redisConnection,
};