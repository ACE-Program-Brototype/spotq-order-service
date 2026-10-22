import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3002),
	NODE_ENV: z
		.enum(["development", "staging", "production", "test"])
		.default("development"),
	DATABASE_URL: z.string().default("postgres://localhost:5432/spotq_order_db"),
	REDIS_URL: z.string().default("redis://localhost:6379"),
	LOG_LEVEL: z.string().default("info"),
	RESTAURANT_SERVICE_URL: z
		.string()
		.url("RESTAURANT_SERVICE_URL must be a valid URL")
		.transform((val) => val.replace(/\/+$/, ""))
		.default("http://localhost:3001"),
	RESTAURANT_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
	SERVICE_NAME: z.string().default("order-service"),
	S2S_SERVICE_NAME: z.string().default("order-service"),
	ORDER_S2S_PRIVATE_KEY: z.preprocess((val) => {
		const key =
			typeof val === "string" && val.trim().length > 0
				? val
				: process.env.S2S_PRIVATE_KEY;
		return typeof key === "string" ? key.replace(/\\n/g, "\n").trim() : "";
	}, z.string().default("")),
	S2S_RESTAURANT_AUDIENCE: z.string().default("restaurant-service"),
	QUEUE_SERVICE_URL: z
		.string()
		.url("QUEUE_SERVICE_URL must be a valid URL")
		.transform((val) => val.replace(/\/+$/, ""))
		.default("http://localhost:3004"),
	QUEUE_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
	S2S_QUEUE_AUDIENCE: z.string().default("queue-service"),
});

const env = envSchema.parse(process.env);

export default env;
