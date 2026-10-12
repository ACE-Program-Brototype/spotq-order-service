/**
 * Redis Connection Configuration
 *
 * Configures ioredis client with environment fallback resolution
 * for local development and containerized networks.
 */

import env from "@config/env.ts";
import { Redis } from "ioredis";

function resolveRedisUrl(rawUrl: string): string {
	try {
		const parsed = new URL(rawUrl);
		if (parsed.hostname === "redis" && process.platform === "darwin") {
			parsed.hostname = "localhost";
			return parsed.toString();
		}
	} catch {}
	return rawUrl;
}

const redisConnection = new Redis(resolveRedisUrl(env.REDIS_URL), {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
});

export default redisConnection;
