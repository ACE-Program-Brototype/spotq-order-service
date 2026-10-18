import env from "@config/env.ts";
import logger from "@infrastructure/logger/pino.ts";
import { generateToken, type TokenIssuerConfig } from "@spotq-org/s2s-core";

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
			const issuerConfig: TokenIssuerConfig = {
				serviceName: callerServiceName,
				privateKey,
			};
			const token = generateToken(targetServiceName, issuerConfig);
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
