import { z } from "zod";

const envSchema = z.object({

    PORT:z.coerce.number().default(3004),
    NODE_ENV:z.enum( ["development", "staging", "production"] ),
    DATABASE_URL:z.url()
});

const env = envSchema.parse(process.env);

export default env;