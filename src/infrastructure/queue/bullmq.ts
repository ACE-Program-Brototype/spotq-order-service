import redisConnection from "@infrastructure/redis/redis.ts";

export const bullMQConfig = {
	connection: redisConnection,
};
