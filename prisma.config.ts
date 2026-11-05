import { defineConfig } from "prisma/config";
import env from "./src/config/env.ts";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		directory: "prisma/migrations",
		seed: "pnpm exec tsx prisma/seed.ts",
	},
	datasource: {
		url: process.env.DATABASE_URL || env.DATABASE_URL,
	},
});
