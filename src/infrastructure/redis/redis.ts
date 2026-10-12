import env from "@config/env.ts";
import { Redis } from "ioredis";

function resolveRedisUrl(rawUrl: string): string {
	try {
		const parsed = new URL(rawUrl);
		if (parsed.hostname === "redis" && process.platform === "darwin") {
			parsed.hostname = "localhost";
			return parsed.toString();
		}
	} catch {
		// keep raw url
	}
	return rawUrl;
}

const redisConnection = new Redis(resolveRedisUrl(env.REDIS_URL), {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
});

export default redisConnection;
