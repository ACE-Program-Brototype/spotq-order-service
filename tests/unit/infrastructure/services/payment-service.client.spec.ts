import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PaymentGatewayDraftFailedError,
	PaymentRefundFailedError,
} from "@domain/errors/index.ts";
import { PaymentServiceClient } from "@infrastructure/services/payment-service.client.ts";
import axios, {
	AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";

describe("PaymentServiceClient", () => {
	const orderId = "11111111-1111-1111-1111-111111111111";
	const customerId = "22222222-2222-2222-2222-222222222222";
	const restaurantId = "33333333-3333-3333-3333-333333333333";
	const paymentId = "44444444-4444-4444-4444-444444444444";
	const refundId = "55555555-5555-5555-5555-555555555555";

	describe("createGatewayOrder", () => {
		it("should create gateway order successfully when payment service returns 201 Created", async () => {
			const originalPost = axios.post;
			let postedUrl = "";
			let postedBody: unknown = null;

			axios.post = (async (url: string, body: unknown) => {
				postedUrl = url;
				postedBody = body;
				return {
					status: 201,
					statusText: "Created",
					headers: {},
					config: {} as unknown as InternalAxiosRequestConfig,
					data: {
						success: true,
						message: "Order gateway order created successfully",
						data: {
							paymentId,
							orderId,
							razorpayOrderId: "order_rzp_123",
							amountPaise: 45000,
							currency: "INR",
							keyId: "rzp_test_key_123",
						},
					},
				} as AxiosResponse;
			}) as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				const result = await client.createGatewayOrder({
					orderId,
					customerId,
					restaurantId,
					amountPaise: 45000,
					currency: "INR",
				});

				assert.ok(postedUrl.includes("/api/internal/v1/payments/orders"));
				assert.deepEqual(postedBody, {
					orderId,
					customerId,
					restaurantId,
					amountPaise: 45000,
					currency: "INR",
				});
				assert.equal(result.paymentId, paymentId);
				assert.equal(result.razorpayOrderId, "order_rzp_123");
				assert.equal(result.amountPaise, 45000);
				assert.equal(result.keyId, "rzp_test_key_123");
			} finally {
				axios.post = originalPost;
			}
		});

		it("should throw PaymentGatewayDraftFailedError when payment service returns success: false", async () => {
			const originalPost = axios.post;
			axios.post = (async () => ({
				status: 200,
				statusText: "OK",
				headers: {},
				config: {} as unknown as InternalAxiosRequestConfig,
				data: {
					success: false,
					message: "Payment provider unavailable",
				},
			})) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				await assert.rejects(
					async () =>
						client.createGatewayOrder({
							orderId,
							customerId,
							restaurantId,
							amountPaise: 45000,
						}),
					(err: unknown) => {
						assert.ok(err instanceof PaymentGatewayDraftFailedError);
						assert.match(err.message, /Payment provider unavailable/);
						return true;
					},
				);
			} finally {
				axios.post = originalPost;
			}
		});

		it("should throw PaymentGatewayDraftFailedError when payment service responds with 400 Bad Request", async () => {
			const originalPost = axios.post;
			axios.post = (async () => {
				const axiosError = new AxiosError("Bad Request");
				axiosError.response = {
					status: 400,
					statusText: "Bad Request",
					headers: {},
					config: {} as unknown as InternalAxiosRequestConfig,
					data: {
						success: false,
						message: "Invalid amount provided",
					},
				};
				throw axiosError;
			}) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				await assert.rejects(
					async () =>
						client.createGatewayOrder({
							orderId,
							customerId,
							restaurantId,
							amountPaise: 0,
						}),
					(err: unknown) => {
						assert.ok(err instanceof PaymentGatewayDraftFailedError);
						assert.match(err.message, /Invalid amount provided/);
						return true;
					},
				);
			} finally {
				axios.post = originalPost;
			}
		});

		it("should throw PaymentGatewayDraftFailedError on network timeout or connection failure", async () => {
			const originalPost = axios.post;
			axios.post = (async () => {
				throw new Error("Network timeout: connect ETIMEDOUT");
			}) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				await assert.rejects(
					async () =>
						client.createGatewayOrder({
							orderId,
							customerId,
							restaurantId,
							amountPaise: 45000,
						}),
					(err: unknown) => {
						assert.ok(err instanceof PaymentGatewayDraftFailedError);
						assert.match(err.message, /Network timeout/);
						return true;
					},
				);
			} finally {
				axios.post = originalPost;
			}
		});
	});

	describe("processRefund", () => {
		it("should process refund successfully when payment service returns 200 OK", async () => {
			const originalPost = axios.post;
			let postedUrl = "";
			let postedBody: unknown = null;
			let capturedHeaders: Record<string, string> | undefined;

			axios.post = (async (
				url: string,
				body: unknown,
				config?: AxiosRequestConfig,
			) => {
				postedUrl = url;
				postedBody = body;
				capturedHeaders = config?.headers as Record<string, string>;
				return {
					status: 200,
					statusText: "OK",
					headers: {},
					config: {} as unknown as InternalAxiosRequestConfig,
					data: {
						success: true,
						message: "Refund processed successfully",
						data: {
							refundId,
							orderId,
							transactionId: "tx-123",
							amountPaise: 45000,
							currency: "INR",
							status: "PROCESSED",
							processedAt: "2026-11-11T20:00:00.000Z",
						},
					},
				} as AxiosResponse;
			}) as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				const result = await client.processRefund({
					orderId,
					amountPaise: 45000,
					reason: "CUSTOMER_CANCELLED",
					notes: "Order cancelled",
					idempotencyKey: orderId,
				});

				assert.ok(postedUrl.includes("/api/internal/v1/payments/refunds"));
				assert.deepEqual(postedBody, {
					orderId,
					amountPaise: 45000,
					reason: "CUSTOMER_CANCELLED",
					notes: "Order cancelled",
				});
				assert.equal(capturedHeaders?.["x-idempotency-key"], orderId);
				assert.equal(result.refundId, refundId);
				assert.equal(result.orderId, orderId);
				assert.equal(result.status, "PROCESSED");
			} finally {
				axios.post = originalPost;
			}
		});

		it("should treat 409 Conflict with PAYMENT_ALREADY_REFUNDED as idempotent success", async () => {
			const originalPost = axios.post;
			axios.post = (async () => {
				const axiosError = new AxiosError("Conflict");
				axiosError.response = {
					status: 409,
					statusText: "Conflict",
					headers: {},
					config: {} as unknown as InternalAxiosRequestConfig,
					data: {
						success: false,
						message: "Payment already refunded",
						data: {
							refundId: "existing-ref-123",
							status: "PROCESSED",
						},
					},
				};
				throw axiosError;
			}) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				const result = await client.processRefund({
					orderId,
					amountPaise: 45000,
					idempotencyKey: orderId,
				});

				assert.equal(result.refundId, "existing-ref-123");
				assert.equal(result.orderId, orderId);
				assert.equal(result.status, "PROCESSED");
			} finally {
				axios.post = originalPost;
			}
		});

		it("should throw PaymentRefundFailedError when payment service returns 400 Bad Request", async () => {
			const originalPost = axios.post;
			axios.post = (async () => {
				const axiosError = new AxiosError("Bad Request");
				axiosError.response = {
					status: 400,
					statusText: "Bad Request",
					headers: {},
					config: {} as unknown as InternalAxiosRequestConfig,
					data: {
						success: false,
						message: "Invalid refund amount",
					},
				};
				throw axiosError;
			}) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				await assert.rejects(
					async () =>
						client.processRefund({
							orderId,
							amountPaise: 0,
							idempotencyKey: orderId,
						}),
					(err: unknown) => {
						assert.ok(err instanceof PaymentRefundFailedError);
						assert.match(err.message, /Invalid refund amount/);
						return true;
					},
				);
			} finally {
				axios.post = originalPost;
			}
		});

		it("should throw PaymentRefundFailedError on network timeout or connection failure", async () => {
			const originalPost = axios.post;
			axios.post = (async () => {
				throw new Error("connect ETIMEDOUT");
			}) as unknown as typeof axios.post;

			try {
				const client = new PaymentServiceClient();
				await assert.rejects(
					async () =>
						client.processRefund({
							orderId,
							amountPaise: 45000,
							idempotencyKey: orderId,
						}),
					(err: unknown) => {
						assert.ok(err instanceof PaymentRefundFailedError);
						assert.match(err.message, /connect ETIMEDOUT/);
						return true;
					},
				);
			} finally {
				axios.post = originalPost;
			}
		});
	});
});
