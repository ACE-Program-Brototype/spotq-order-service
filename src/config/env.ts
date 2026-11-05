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
		.default("http://restaurant-service:3001"),
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
		.default("http://queue-service:3004"),
	QUEUE_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
	S2S_QUEUE_AUDIENCE: z.string().default("queue-service"),
	PAYMENT_SERVICE_URL: z
		.string()
		.url("PAYMENT_SERVICE_URL must be a valid URL")
		.transform((val) => val.replace(/\/+$/, ""))
		.default("http://payment-service:3003"),
	PAYMENT_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
	S2S_PAYMENT_AUDIENCE: z.string().default("payment-service"),
	RABBITMQ_URL: z.string().default("amqp://guest:guest@rabbitmq:5672"),
	RABBITMQ_QUEUE_ORDER_EVENTS: z.string().default("order-events"),
	TAX_PERCENT: z.coerce.number().min(0).max(100).default(5),
});

const env = envSchema.parse(process.env);

export default env;
