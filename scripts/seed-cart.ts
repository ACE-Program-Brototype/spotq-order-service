/**
 * Database Seed Script - Test Active Cart
 *
 * Verifies if an active cart exists in PostgreSQL.
 * If none exists, seeds an active Cart with CartItem and CartItemAddon relations,
 * then displays test connection parameters and credentials for Bruno testing.
 */

import jwt from "jsonwebtoken";
import prisma from "../src/infrastructure/database/prisma.ts";

const TEST_USER_ID = "7c1a9d44-22f4-4ab8-91ef-123456789abc";
const TEST_RESTAURANT_ID = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
const TEST_MENU_ITEM_ID = "3f2a1b00-55de-4d39-a9a7-9f6b986e8123";
const TEST_VARIANT_ID = "9a8b7c6d-1111-4222-b333-c44455566677";
const TEST_ADDON_ID = "77aa88bb-99cc-4dde-aff0-1234567890ab";

async function seedCart() {
	try {
		console.log("Checking for active carts in database...");

		let cart = await prisma.cart.findFirst({
			where: {
				userId: TEST_USER_ID,
				restaurantId: TEST_RESTAURANT_ID,
				expiresAt: {
					gt: new Date(),
				},
				items: {
					some: {},
				},
			},
			include: {
				items: {
					include: {
						addons: true,
					},
				},
			},
		});

		if (!cart) {
			console.log("No active cart with items found. Seeding new test cart...");

			await prisma.cart.deleteMany({
				where: {
					userId: TEST_USER_ID,
					restaurantId: TEST_RESTAURANT_ID,
				},
			});

			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			cart = await prisma.cart.create({
				data: {
					userId: TEST_USER_ID,
					restaurantId: TEST_RESTAURANT_ID,
					expiresAt,
					items: {
						create: [
							{
								menuItemId: TEST_MENU_ITEM_ID,
								variantId: TEST_VARIANT_ID,
								quantity: 2,
								specialInstructions: "Extra crispy, no onions",
								addons: {
									create: [
										{
											addonId: TEST_ADDON_ID,
										},
									],
								},
							},
						],
					},
				},
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			console.log("Successfully seeded new active cart!");
		} else {
			console.log("Existing active cart found in database.");
		}

		const token = jwt.sign(
			{
				sub: cart.userId,
				userId: cart.userId,
				role: "CUSTOMER",
				email: "customer@spotq.com",
			},
			"mock-secret",
			{ expiresIn: "24h" },
		);

		console.log("\n==========================================");
		console.log("CART DETAILS FOR BRUNO TESTING");
		console.log("==========================================");
		console.log(`Cart ID       : ${cart.id}`);
		console.log(`User ID       : ${cart.userId}`);
		console.log(`Restaurant ID : ${cart.restaurantId}`);
		console.log(`Expires At    : ${cart.expiresAt.toISOString()}`);
		console.log(`Items Count   : ${cart.items.length}`);
		console.log(`Addons Count  : ${cart.items[0]?.addons.length ?? 0}`);
		console.log(
			`Gateway URL   : http://localhost:10000/api/v1/carts/${cart.id}`,
		);
		console.log(
			`Direct URL    : http://localhost:3002/api/v1/carts/${cart.id}`,
		);
		console.log(`Header 1      : x-user-id: ${cart.userId}`);
		console.log(`Header 2      : Authorization: Bearer ${token}`);
		console.log("==========================================\n");

		return cart;
	} catch (error) {
		console.error("Error seeding cart:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seedCart();
