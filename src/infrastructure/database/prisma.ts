import env from "@config/env.ts";
import { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: true,
	},
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

export default prisma;
