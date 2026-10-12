import env from "@config/env.ts";
import { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const poolUrl = new URL(env.DATABASE_URL);
poolUrl.searchParams.delete("sslmode");

const pool = new Pool({
	connectionString: poolUrl.toString(),
	ssl: {
		rejectUnauthorized: false,
	},
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

export default prisma;
