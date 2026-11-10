import env from "@config/env.ts";
import logger from "@infrastructure/observability/logger.ts";
import {
	CircuitBreaker,
	type CircuitBreakerOptions,
} from "@spotq-org/circuit-breaker";

export interface ServiceCircuitBreakerConfig<TArgs extends unknown[], TReturn>
	extends Omit<CircuitBreakerOptions<TArgs, TReturn>, "name"> {
	name: string;
	serviceName: string;
	endpointTag?: string;
}

export function createServiceCircuitBreaker<
	TArgs extends unknown[] = unknown[],
	TReturn = unknown,
>(
	action: (...args: TArgs) => Promise<TReturn> | TReturn,
	config: ServiceCircuitBreakerConfig<TArgs, TReturn>,
): CircuitBreaker<TArgs, TReturn> {
	const { serviceName, endpointTag, name, ...restOptions } = config;

	return new CircuitBreaker(action, {
		name,
		timeoutMs: restOptions.timeoutMs ?? env.CIRCUIT_BREAKER_TIMEOUT_MS,
		resetTimeoutMs:
			restOptions.resetTimeoutMs ?? env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
		errorThresholdPercentage:
			restOptions.errorThresholdPercentage ??
			env.CIRCUIT_BREAKER_ERROR_THRESHOLD_PERCENTAGE,
		volumeThreshold:
			restOptions.volumeThreshold ?? env.CIRCUIT_BREAKER_VOLUME_THRESHOLD,
		rollingWindowMs:
			restOptions.rollingWindowMs ?? env.CIRCUIT_BREAKER_ROLLING_WINDOW_MS,
		onOpen: () => {
			logger.warn(
				{
					targetService: serviceName,
					endpoint: endpointTag ?? name,
					breaker: name,
					state: "OPEN",
				},
				`Circuit breaker [${name}] for service '${serviceName}' tripped to OPEN`,
			);
			restOptions.onOpen?.();
		},
		onClose: () => {
			logger.info(
				{
					targetService: serviceName,
					endpoint: endpointTag ?? name,
					breaker: name,
					state: "CLOSED",
				},
				`Circuit breaker [${name}] for service '${serviceName}' recovered to CLOSED`,
			);
			restOptions.onClose?.();
		},
		onHalfOpen: () => {
			logger.info(
				{
					targetService: serviceName,
					endpoint: endpointTag ?? name,
					breaker: name,
					state: "HALF_OPEN",
				},
				`Circuit breaker [${name}] for service '${serviceName}' entered HALF_OPEN (trial probe)`,
			);
			restOptions.onHalfOpen?.();
		},
		...restOptions,
	});
}
