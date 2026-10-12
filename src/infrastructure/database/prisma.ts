import fs from "node:fs";
import path from "node:path";
import env from "@config/env.ts";
import { PrismaClient } from "@generated/prisma/client.ts";
import logger from "@infrastructure/logger/pino.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg, { type PoolConfig } from "pg";

/**
 * PostgreSQL Timestamp Type Parsers
 * Standardize timestamp parsing to UTC Date objects:
 * - OID 1114: TIMESTAMP (without time zone) -> parse as UTC ISO
 * - OID 1184: TIMESTAMPTZ (with time zone) -> parse directly into Date
 */
pg.types.setTypeParser(
	1114,
	(stringValue: string) => new Date(`${stringValue}Z`),
);
pg.types.setTypeParser(1184, (stringValue: string) => new Date(stringValue));

let ssl:
	| (PoolConfig["ssl"] & { rejectUnauthorized?: boolean; ca?: string })
	| undefined;

const poolUrl = new URL(env.DATABASE_URL);
const isSslRequested =
	poolUrl.searchParams.get("sslmode") === "require" ||
	poolUrl.searchParams.get("sslmode") === "prefer" ||
	poolUrl.searchParams.get("sslmode") === "verify-full" ||
	poolUrl.searchParams.get("sslmode") === "verify-ca" ||
	poolUrl.protocol === "postgres:" ||
	poolUrl.protocol === "postgresql:";

if (isSslRequested) {
	let caContent: string | undefined;
	const envCaCert = process.env.DATABASE_CA_CERT;

	if (envCaCert) {
		if (envCaCert.includes("BEGIN CERTIFICATE")) {
			caContent = envCaCert.replace(/\\n/g, "\n");
		} else {
			try {
				caContent = fs.readFileSync(envCaCert, "utf8");
			} catch (error) {
				logger.warn(
					{ err: error },
					`Failed to read database CA certificate from env path: ${envCaCert}`,
				);
			}
		}
	} else {
		const defaultCertPath = path.resolve(process.cwd(), ".certs", "ca.pem");
		try {
			if (fs.existsSync(defaultCertPath)) {
				caContent = fs.readFileSync(defaultCertPath, "utf8");
			}
		} catch (_error) {
			// No local cert file present
		}
	}

	if (caContent) {
		ssl = {
			rejectUnauthorized: true,
			ca: caContent,
		};
	} else {
		// Aiven and cloud PostgreSQL providers use custom/self-signed Root CAs.
		// Without a local CA certificate installed, rejectUnauthorized: false allows
		// TLS wire encryption while avoiding certificate verification rejection.
		ssl = {
			rejectUnauthorized: false,
		};
	}
}

poolUrl.searchParams.delete("sslmode");

const pool = new pg.Pool({
	connectionString: poolUrl.toString(),
	ssl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
});

export default prisma;
