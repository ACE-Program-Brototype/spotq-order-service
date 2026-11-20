import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { beforeEach, describe, it } from "node:test";
import {
	createLogger,
	loggerLocalStorage,
} from "@infrastructure/observability/logger.ts";

describe("Universal Structured JSON Logger (SCRUM-1296)", () => {
	let logOutput: Record<string, unknown>[] = [];
	let testLogger: ReturnType<typeof createLogger>;

	beforeEach(() => {
		logOutput = [];
		const stream = new Writable({
			write(chunk, _encoding, callback) {
				const str = chunk.toString().trim();
				if (str.startsWith("{") && str.endsWith("}")) {
					try {
						logOutput.push(JSON.parse(str));
					} catch {
						// ignore non-json chunks
					}
				}
				callback();
			},
		});
		testLogger = createLogger(stream, { level: "debug" });
	});

	it("should emit single-line JSON adhering to the 6 core blocks", () => {
		loggerLocalStorage.run(
			{
				correlationId: "req-9a8b7c6d-5e4f",
				requestId: "req-9a8b7c6d-5e4f",
				traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
				spanId: "00f067aa0ba902b7",
			},
			() => {
				testLogger.info(
					{
						context: {
							restaurant_id: "5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8",
							customer_id: "163a57cb-6f3b-4188-8a9b-977f682f70e0",
							order_id: "ord_88291039",
						},
						http: {
							method: "POST",
							path: "/api/v1/orders",
							status_code: 201,
							duration_ms: 42.5,
							client_ip: "103.21.244.12",
						},
					},
					"Order created successfully",
				);
			},
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.level, "INFO");
		assert.equal(log.message, "Order created successfully");
		assert.equal(typeof log.timestamp, "string");
		assert.match(
			log.timestamp as string,
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
		);

		const service = log.service as Record<string, unknown>;
		assert.ok(service);
		assert.equal(service.name, "order-service");
		assert.equal(typeof service.version, "string");
		assert.equal(typeof service.environment, "string");

		assert.deepEqual(log.trace, {
			correlation_id: "req-9a8b7c6d-5e4f",
			trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
			span_id: "00f067aa0ba902b7",
		});

		assert.deepEqual(log.http, {
			method: "POST",
			path: "/api/v1/orders",
			status_code: 201,
			duration_ms: 42.5,
			client_ip: "103.21.244.12",
		});

		assert.deepEqual(log.context, {
			restaurant_id: "5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8",
			customer_id: "163a57cb-6f3b-4188-8a9b-977f682f70e0",
			order_id: "ord_88291039",
		});
	});

	it("should format Log Type 1: HTTP Access Request Log", () => {
		loggerLocalStorage.run(
			{
				correlationId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
				requestId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
			},
			() => {
				testLogger.info(
					{
						http: {
							method: "POST",
							path: "/api/v1/orders",
							status_code: 201,
							duration_ms: 38.2,
						},
					},
					"HTTP POST /api/v1/orders 201 (38.2ms)",
				);
			},
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.level, "INFO");
		assert.equal(log.message, "HTTP POST /api/v1/orders 201 (38.2ms)");
		assert.deepEqual(log.http, {
			method: "POST",
			path: "/api/v1/orders",
			status_code: 201,
			duration_ms: 38.2,
		});
		assert.deepEqual(log.trace, {
			correlation_id: "74939645-acb7-4d8d-9169-45ac8efaf67e",
		});
	});

	it("should format Log Type 2: Application Error Log with dedicated error object", () => {
		const dbError = new Error(
			"Too many database connections opened: remaining connection slots are reserved",
		);
		(dbError as unknown as { code: string }).code = "P2037";
		dbError.name = "PrismaClientKnownRequestError";

		loggerLocalStorage.run(
			{
				correlationId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
				requestId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
			},
			() => {
				testLogger.error(
					{
						err: dbError,
						context: {
							restaurant_id: "5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8",
						},
					},
					"Database transaction failed while creating order",
				);
			},
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.level, "ERROR");
		assert.equal(
			log.message,
			"Database transaction failed while creating order",
		);
		const errorObj = log.error as Record<string, unknown>;
		assert.ok(errorObj);
		assert.equal(errorObj.name, "PrismaClientKnownRequestError");
		assert.equal(errorObj.code, "P2037");
		assert.equal(
			errorObj.message,
			"Too many database connections opened: remaining connection slots are reserved",
		);
		assert.equal(typeof errorObj.stack, "string");
		assert.deepEqual(log.context, {
			restaurant_id: "5dc5f92c-03b9-4eb1-85f5-88bf4159f0c8",
		});
	});

	it("should format Log Type 3: Business / Domain Event Log", () => {
		loggerLocalStorage.run(
			{
				correlationId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
				requestId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
			},
			() => {
				testLogger.info(
					{
						event: {
							action: "ORDER_CREATED",
							amount: 450.0,
							currency: "INR",
						},
					},
					"Order created and pending payment",
				);
			},
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.level, "INFO");
		assert.equal(log.message, "Order created and pending payment");
		assert.deepEqual(log.event, {
			action: "ORDER_CREATED",
			amount: 450.0,
			currency: "INR",
		});
	});

	it("should format Log Type 4: Background Broker / Job Log", () => {
		loggerLocalStorage.run(
			{
				correlationId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
				requestId: "74939645-acb7-4d8d-9169-45ac8efaf67e",
			},
			() => {
				testLogger.info(
					{
						job: {
							queue: "order-events",
							routing_key: "payment.order.captured",
							duration_ms: 14.2,
							status: "COMPLETED",
						},
					},
					"Processed payment event 'payment.order.captured'",
				);
			},
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.level, "INFO");
		assert.equal(
			log.message,
			"Processed payment event 'payment.order.captured'",
		);
		assert.deepEqual(log.job, {
			queue: "order-events",
			routing_key: "payment.order.captured",
			duration_ms: 14.2,
			status: "COMPLETED",
		});
	});

	it("should automatically extract dynamic IDs into context block", () => {
		testLogger.info(
			{
				userId: "usr_12345",
				customerId: "cust_67890",
				orderId: "ord_555",
				cartId: "cart_777",
				restaurantId: "rest_999",
				paymentId: "pay_111",
			},
			"Order placed successfully",
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.deepEqual(log.context, {
			user_id: "usr_12345",
			customer_id: "cust_67890",
			order_id: "ord_555",
			cart_id: "cart_777",
			restaurant_id: "rest_999",
			payment_id: "pay_111",
		});
	});

	it("should redact sensitive information such as passwords, tokens, signatures and card details", () => {
		testLogger.info(
			{
				password: "super_secret_password",
				token: "jwt_bearer_token",
				otp: "123456",
				razorpay_signature: "abc123secretmocksignature",
				cardNumber: "4111111111111111",
				cvv: "123",
				context: {
					password: "nested_password",
					token: "nested_token",
					razorpay_signature: "nested_signature",
				},
			},
			"Sensitive log attempt",
		);

		assert.equal(logOutput.length, 1);
		const log = logOutput[0] as Record<string, unknown>;

		assert.equal(log.password, "[REDACTED]");
		assert.equal(log.token, "[REDACTED]");
		assert.equal(log.otp, "[REDACTED]");
		assert.equal(log.razorpay_signature, "[REDACTED]");
		assert.equal(log.cardNumber, "[REDACTED]");
		assert.equal(log.cvv, "[REDACTED]");

		const context = log.context as Record<string, unknown>;
		assert.equal(context.password, "[REDACTED]");
		assert.equal(context.token, "[REDACTED]");
		assert.equal(context.razorpay_signature, "[REDACTED]");
	});
});
