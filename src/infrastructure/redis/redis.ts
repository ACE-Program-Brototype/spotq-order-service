import { Redis } from "ioredis";
import env from "@config/env.js";

const redisConnection = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
});

export default redisConnection;
