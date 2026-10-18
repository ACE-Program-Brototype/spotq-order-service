import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3002),
	NODE_ENV: z.enum(["development", "staging", "production"]),
	DATABASE_URL: z.string(),
	REDIS_URL: z.string(),
	LOG_LEVEL: z.string(),
	RESTAURANT_SERVICE_URL: z
		.string()
		.url("RESTAURANT_SERVICE_URL must be a valid URL")
		.transform((val) => val.replace(/\/+$/, "")),
	RESTAURANT_SERVICE_TIMEOUT_MS: z.coerce.number().default(5000),
	S2S_SERVICE_NAME: z.string().default("order-service"),

	ORDER_S2S_PRIVATE_KEY: z.preprocess(
		(val) => (typeof val === "string" ? val.replace(/\\n/g, "\n") : ""),
		z.string().default(""),
	),
});

const env = envSchema.parse(process.env);

export default env;
