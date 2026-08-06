import { Pool } from "pg"
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import env from "../../config/env.js";

const pool = new Pool({

    connectionString: env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter
});

export default prisma;