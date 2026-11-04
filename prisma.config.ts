import { defineConfig } from "prisma/config";
import env from "./src/config/env.ts";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "pnpm exec tsx prisma/seed.ts",
	},
	datasource: {
		url: env.DATABASE_URL,
	},
});
