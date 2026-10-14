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
});

const env = envSchema.parse(process.env);

export default env;
