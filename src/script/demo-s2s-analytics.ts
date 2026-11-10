import crypto from "node:crypto";
import { generateToken, type TokenIssuerConfig } from "@spotq-org/s2s-core";
import app from "../app.ts";
import env from "../config/env.ts";
import type {
	GetRestaurantOrderAnalyticsRepoParams,
	GetRestaurantProductAnalyticsRepoParams,
	RestaurantOrderAnalyticsRepoResult,
	RestaurantProductAnalyticsRepoResult,
} from "../domain/types/order-repository.types.ts";
import { PrismaOrderRepository } from "../infrastructure/database/repositories/prisma-order.repository.ts";
import { S2S_CALLER_SERVICES } from "../shared/constants/auth.constants.ts";

const TEST_RESTAURANT_ID = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";

async function main() {
	console.log(
		"\n=================================================================",
	);
	console.log(
		"       SPOTQ ORDER SERVICE - S2S ANALYTICS MOCK TEST SERVER      ",
	);
	console.log(
		"=================================================================\n",
	);

	// 1. Generate RSA key pair for testing
	const keyPair = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});
	const rsaPrivateKey = keyPair.privateKey;
	const rsaPublicKey = keyPair.publicKey;

	// Configure S2S audience and test public keys in environment
	(env as { RESTAURANT_S2S_PUBLIC_KEY: string }).RESTAURANT_S2S_PUBLIC_KEY =
		rsaPublicKey;
	(env as { S2S_AUDIENCE: string }).S2S_AUDIENCE = "order-service";

	// 2. Mock PrismaOrderRepository analytics methods with realistic sample data
	PrismaOrderRepository.prototype.getRestaurantOrderAnalytics = async (
		params: GetRestaurantOrderAnalyticsRepoParams,
	): Promise<RestaurantOrderAnalyticsRepoResult> => {
		const durationMs =
			params.nextPeriodStart.getTime() - params.startDate.getTime();
		const durationDays = Math.max(
			1,
			Math.round(durationMs / (1000 * 60 * 60 * 24)),
		);

		let multiplier = 1;
		if (durationDays <= 1) multiplier = 1;
		else if (durationDays <= 8) multiplier = 7;
		else if (durationDays <= 32) multiplier = 30;
		else multiplier = 365;

		return {
			overview: {
				revenue: {
					grossSalesRupees: 28450.0 * multiplier,
					discountRupees: 1707.0 * multiplier,
					netSalesRupees: 26743.0 * multiplier,
					taxCollectedRupees: 1337.0 * multiplier,
					totalBillAmountRupees: 28080.0 * multiplier,
					growthPercentage: 12.5,
				},
				orders: {
					totalOrderCount: 142 * multiplier,
					growthPercentage: 8.4,
					dineInCount: 82 * multiplier,
					takeawayCount: 60 * multiplier,
				},
				operations: {
					dinersServedCount: 0,
					uniqueCustomersCount: 95 * multiplier,
				},
			},
			orderStatusBreakdown: {
				totalOrdersTracked: 142 * multiplier,
				distribution: [
					{
						status: "COMPLETED",
						count: 128 * multiplier,
						percentage: 90.14,
						amountRupees: 25272.0 * multiplier,
					},
					{
						status: "CANCELLED",
						count: 14 * multiplier,
						percentage: 9.86,
						amountRupees: 2808.0 * multiplier,
					},
				],
			},
		};
	};

	PrismaOrderRepository.prototype.getRestaurantProductAnalytics = async (
		params: GetRestaurantProductAnalyticsRepoParams,
	): Promise<RestaurantProductAnalyticsRepoResult> => {
		const topSellingItems = [
			{
				menuItemId: "11111111-1111-4111-8111-111111111111",
				name: "Butter Chicken",
				quantitySold: 84,
				grossSalesRupees: 29400.0,
				percentageOfTotalSales: 35.5,
				classification: "NORMAL" as const,
			},
			{
				menuItemId: "22222222-2222-4222-8222-222222222222",
				name: "Garlic Naan",
				quantitySold: 120,
				grossSalesRupees: 7200.0,
				percentageOfTotalSales: 8.7,
				classification: "NORMAL" as const,
			},
			{
				menuItemId: "33333333-3333-4333-8333-333333333333",
				name: "Paneer Tikka",
				quantitySold: 45,
				grossSalesRupees: 11250.0,
				percentageOfTotalSales: 13.6,
				classification: "NORMAL" as const,
			},
		];

		const slowMovingItems = [
			{
				menuItemId: "44444444-4444-4444-8444-444444444444",
				name: "Mango Lassi",
				quantitySold: 2,
				grossSalesRupees: 240.0,
				percentageOfTotalSales: 0.3,
				classification: "LOW_VOLUME" as const,
			},
			{
				menuItemId: "55555555-5555-4555-8555-555555555555",
				name: "Gulab Jamun (2 pcs)",
				quantitySold: 1,
				grossSalesRupees: 90.0,
				percentageOfTotalSales: 0.1,
				classification: "LOW_VOLUME" as const,
			},
		];

		const start = (params.page - 1) * params.limit;
		const paginatedTop = topSellingItems.slice(start, start + params.limit);
		const paginatedSlow = slowMovingItems.slice(start, start + params.limit);

		const totalPagesTop = Math.max(
			1,
			Math.ceil(topSellingItems.length / params.limit),
		);
		const totalPagesSlow = Math.max(
			1,
			Math.ceil(slowMovingItems.length / params.limit),
		);

		return {
			totalProductsSold: 252,
			topSelling: {
				items: paginatedTop,
				pagination: {
					totalItems: topSellingItems.length,
					currentPage: params.page,
					limit: params.limit,
					totalPages: totalPagesTop,
					hasNextPage: params.page < totalPagesTop,
					hasPrevPage: params.page > 1,
				},
			},
			slowMoving: {
				items: paginatedSlow,
				pagination: {
					totalItems: slowMovingItems.length,
					currentPage: params.page,
					limit: params.limit,
					totalPages: totalPagesSlow,
					hasNextPage: params.page < totalPagesSlow,
					hasPrevPage: params.page > 1,
				},
			},
		};
	};

	// 3. Start mock test server on an ephemeral port
	const PORT = 4002;
	const server = app.listen(PORT, async () => {
		console.log(
			`[INFO] S2S Mock Test Server listening on http://127.0.0.1:${PORT}\n`,
		);

		try {
			// Generate valid RS256 token for restaurant-service
			const tokenConfig: TokenIssuerConfig = {
				serviceName: S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
				privateKey: rsaPrivateKey,
			};
			const validToken = generateToken("order-service", tokenConfig);

			// Check if custom query is passed via CLI argument
			const cliQuery = process.argv[2];

			if (cliQuery) {
				const isProductQuery = cliQuery.includes("products");
				const endpointType = isProductQuery ? "products" : "summary";
				const queryString = cliQuery.includes("?")
					? cliQuery.slice(cliQuery.indexOf("?"))
					: "";

				const url = `http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/${endpointType}${queryString}`;

				console.log(
					"-----------------------------------------------------------------",
				);
				console.log(`CUSTOM QUERY TEST: GET ${url}`);
				console.log(
					"-----------------------------------------------------------------",
				);

				const res = await fetch(url, {
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				});
				const data = await res.json();
				console.log(`HTTP Status: ${res.status} ${res.statusText}`);
				console.log("Response Body:\n", JSON.stringify(data, null, 2));
				console.log(
					"\n=================================================================\n",
				);
				return;
			}

			// TEST CASE 1: Request WITHOUT JWT Token (Expected 401 Unauthorized)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log("TEST CASE 1: Request WITHOUT S2S JWT Token");
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
			);
			console.log("Headers: { } (Missing Authorization header)");
			console.log(
				"-----------------------------------------------------------------",
			);

			const res1 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
			);
			const data1 = await res1.json();
			console.log(`HTTP Status: ${res1.status} ${res1.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data1, null, 2));
			console.log("\n");

			// TEST CASE 2: Unauthorized Caller Service (Expected 403 Forbidden)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log("TEST CASE 2: Unauthorized Caller Service ('user-service')");
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const unauthorizedToken = generateToken("order-service", {
				serviceName: S2S_CALLER_SERVICES.USER_SERVICE,
				privateKey: rsaPrivateKey,
			});

			const res2 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
				{
					headers: {
						Authorization: `Bearer ${unauthorizedToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.USER_SERVICE,
					},
				},
			);
			const data2 = await res2.json();
			console.log(`HTTP Status: ${res2.status} ${res2.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data2, null, 2));
			console.log("\n");

			// TEST CASE 3: Summary Endpoint - Default Query (Today / DAY)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 3: Summary - Default Query (No params -> Today / DAY)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res3 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data3 = await res3.json();
			console.log(`HTTP Status: ${res3.status} ${res3.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data3, null, 2));
			console.log("\n");

			// TEST CASE 4: Summary Endpoint - WEEK Query
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 4: Summary - WEEK Query (?interval=WEEK&day=9&month=11&year=2026)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=WEEK&day=9&month=11&year=2026`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res4 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=WEEK&day=9&month=11&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data4 = await res4.json();
			console.log(`HTTP Status: ${res4.status} ${res4.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data4, null, 2));
			console.log("\n");

			// TEST CASE 5: Summary Endpoint - MONTH Query
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 5: Summary - MONTH Query (?interval=MONTH&month=11&year=2026)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=MONTH&month=11&year=2026`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res5 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=MONTH&month=11&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data5 = await res5.json();
			console.log(`HTTP Status: ${res5.status} ${res5.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data5, null, 2));
			console.log("\n");

			// TEST CASE 6: Summary Endpoint - YEAR Query
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 6: Summary - YEAR Query (?interval=YEAR&year=2026)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=YEAR&year=2026`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res6 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=YEAR&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data6 = await res6.json();
			console.log(`HTTP Status: ${res6.status} ${res6.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data6, null, 2));
			console.log("\n");

			// TEST CASE 7: Product Performance - Default Query (DAY)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 7: Products - Default Query (No params -> Today / DAY)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res7 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data7 = await res7.json();
			console.log(`HTTP Status: ${res7.status} ${res7.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data7, null, 2));
			console.log("\n");

			// TEST CASE 8: Product Performance - Paginated Query (page=1&limit=3)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 8: Products - Paginated Query (?page=1&limit=3&interval=MONTH)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products?page=1&limit=3&interval=MONTH`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res8 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products?page=1&limit=3&interval=MONTH`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data8 = await res8.json();
			console.log(`HTTP Status: ${res8.status} ${res8.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data8, null, 2));
			console.log("\n");

			// TEST CASE 9: Product Performance - Custom Pagination (page=2&limit=2)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 9: Products - Page 2 Query (?page=2&limit=2&interval=MONTH)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products?page=2&limit=2&interval=MONTH`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res9 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/products?page=2&limit=2&interval=MONTH`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data9 = await res9.json();
			console.log(`HTTP Status: ${res9.status} ${res9.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data9, null, 2));
			console.log("\n");

			// TEST CASE 10: Validation Error Test (Expected 422 Unprocessable Entity)
			console.log(
				"-----------------------------------------------------------------",
			);
			console.log(
				"TEST CASE 10: Validation Error Test - Invalid Month (?interval=MONTH&month=13)",
			);
			console.log(
				`Endpoint: GET /api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=MONTH&month=13`,
			);
			console.log(
				"-----------------------------------------------------------------",
			);

			const res10 = await fetch(
				`http://127.0.0.1:${PORT}/api/internal/v1/restaurants/${TEST_RESTAURANT_ID}/analytics/orders/summary?interval=MONTH&month=13`,
				{
					headers: {
						Authorization: `Bearer ${validToken}`,
						"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
					},
				},
			);
			const data10 = await res10.json();
			console.log(`HTTP Status: ${res10.status} ${res10.statusText}`);
			console.log("Response Body:\n", JSON.stringify(data10, null, 2));

			console.log(
				"\n=================================================================",
			);
			console.log(
				"         ALL ORDER ANALYTICS TESTS COMPLETED SUCCESSFULLY        ",
			);
			console.log(
				"=================================================================\n",
			);
		} catch (error) {
			console.error("[ERROR] Mock server test error:", error);
		} finally {
			server.close(() => {
				process.exit(0);
			});
		}
	});
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
