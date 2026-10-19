import env from "@config/env.ts";
import logger from "@infrastructure/logger/pino.ts";
import { generateToken, type TokenIssuerConfig } from "@spotq-org/s2s-core";

interface CachedToken {
	token: string;
	expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();
const TOKEN_TTL_MS = 10 * 60 * 1000;

export function getCachedS2SToken(
	targetServiceName: string,
	privateKey: string,
	callerServiceName: string = env.S2S_SERVICE_NAME,
): string {
	const cacheKey = `${callerServiceName}:${targetServiceName}`;
	const cached = tokenCache.get(cacheKey);
	const now = Date.now();

	if (cached && cached.expiresAt > now) {
		return cached.token;
	}

	const issuerConfig: TokenIssuerConfig = {
		serviceName: callerServiceName,
		privateKey,
	};
	const token = generateToken(targetServiceName, issuerConfig);
	tokenCache.set(cacheKey, {
		token,
		expiresAt: now + TOKEN_TTL_MS,
	});

	return token;
}

export function getS2SInternalHeaders(
	targetServiceName: string,
	privateKey?: string,
	callerServiceName: string = env.S2S_SERVICE_NAME,
): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"x-caller-service": callerServiceName,
	};

	if (privateKey) {
		try {
			const token = getCachedS2SToken(
				targetServiceName,
				privateKey,
				callerServiceName,
			);
			headers.Authorization = `Bearer ${token}`;
		} catch (error) {
			logger.error(
				{ err: error, targetServiceName },
				`Failed to generate S2S token for ${targetServiceName}`,
			);
		}
	}

	return headers;
}

export default getS2SInternalHeaders;
