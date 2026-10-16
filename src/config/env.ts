import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3002),
	NODE_ENV: z
		.enum(["development", "staging", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string().default("postgres://localhost:5432/spotq_order_db"),
	REDIS_URL: z.string().default("redis://localhost:6379"),
	LOG_LEVEL: z.string().default("info"),
	RESTAURANT_SERVICE_URL: z.string().default("http://localhost:3001"),
	SERVICE_NAME: z.string().default("order-service"),
	S2S_PRIVATE_KEY: z.preprocess((val) => {
		if (typeof val === "string" && val.trim().length > 0) {
			return val.replace(/\\n/g, "\n").trim();
		}
		if (
			typeof process.env.ORDER_S2S_PRIVATE_KEY === "string" &&
			process.env.ORDER_S2S_PRIVATE_KEY.trim().length > 0
		) {
			return process.env.ORDER_S2S_PRIVATE_KEY.replace(/\\n/g, "\n").trim();
		}
		return undefined;
	}, z.string().optional()),
	S2S_RESTAURANT_AUDIENCE: z.string().default("restaurant-service"),
});

const env = envSchema.parse(process.env);

export default env;
