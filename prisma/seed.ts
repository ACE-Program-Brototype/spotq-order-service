import { randomUUID } from "node:crypto";
import {
	OrderStatus,
	OrderType,
	PaymentMode,
	PaymentStatus,
} from "../src/generated/prisma/enums.ts";
import prisma from "../src/infrastructure/database/prisma.ts";

const TARGET_RESTAURANT_ID = "3dc35af0-3ff5-4ee9-a60a-fbb47124731b";

interface SeedItemAddon {
	addonName: string;
	price: number;
}

interface SeedItem {
	itemName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions?: string;
	addons?: SeedItemAddon[];
}

interface SeedOrder {
	restaurantId?: string;
	orderNumber: string;
	orderType: OrderType;
	paymentMode: PaymentMode;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	priority: number;
	userName: string;
	userPhone: string;
	tableNumber?: number;
	subtotal: number;
	taxAmount: number;
	platformFee: number;
	discountAmount: number;
	couponCode?: string;
	grandTotal: number;
	specialInstructions?: string;
	createdAtOffsetHours: number;
	items: SeedItem[];
	historyStatuses: OrderStatus[];
}

const sampleOrders: SeedOrder[] = [
	{
		orderNumber: "ORD-3DC35-001",
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.COMPLETED,
		priority: 1,
		userName: "Alex Johnson",
		userPhone: "+1555123401",
		tableNumber: 5,
		subtotal: 35.0,
		taxAmount: 2.8,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 39.3,
		createdAtOffsetHours: 48,
		items: [
			{
				itemName: "Truffle Bacon Burger",
				quantity: 2,
				unitPrice: 14.0,
				totalPrice: 28.0,
				addons: [
					{ addonName: "Extra Aged Cheddar", price: 2.0 },
					{ addonName: "Crispy Jalapenos", price: 1.0 },
				],
			},
			{
				itemName: "Parmesan Truffle Fries",
				quantity: 1,
				unitPrice: 7.0,
				totalPrice: 7.0,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
			OrderStatus.COMPLETED,
		],
	},
	{
		orderNumber: "ORD-3DC35-002",
		orderType: OrderType.TAKEAWAY,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.COMPLETED,
		priority: 2,
		userName: "Emma Davis",
		userPhone: "+1555123402",
		subtotal: 48.0,
		taxAmount: 3.84,
		platformFee: 1.5,
		discountAmount: 5.0,
		couponCode: "WELCOME5",
		grandTotal: 48.34,
		createdAtOffsetHours: 36,
		items: [
			{
				itemName: "Artisan Margherita Pizza",
				quantity: 2,
				unitPrice: 18.0,
				totalPrice: 36.0,
			},
			{
				itemName: "Garlic Herb Knots",
				quantity: 1,
				unitPrice: 6.0,
				totalPrice: 6.0,
			},
			{
				itemName: "Italian Blood Orange Soda",
				quantity: 2,
				unitPrice: 3.0,
				totalPrice: 6.0,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.COMPLETED,
		],
	},
	{
		orderNumber: "ORD-3DC35-003",
		orderType: OrderType.PRE_ORDER,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.COMPLETED,
		priority: 1,
		userName: "Liam Wilson",
		userPhone: "+1555123403",
		subtotal: 60.0,
		taxAmount: 4.8,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 66.3,
		createdAtOffsetHours: 24,
		items: [
			{
				itemName: "Grilled Salmon Poke Bowl",
				quantity: 2,
				unitPrice: 22.0,
				totalPrice: 44.0,
				addons: [{ addonName: "Avocado Slices", price: 2.5 }],
			},
			{
				itemName: "Quinoa Greek Salad",
				quantity: 1,
				unitPrice: 12.0,
				totalPrice: 12.0,
			},
			{
				itemName: "Iced Matcha Latte",
				quantity: 1,
				unitPrice: 4.0,
				totalPrice: 4.0,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.COMPLETED,
		],
	},
	{
		orderNumber: "ORD-3DC35-004",
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.PREPARING,
		priority: 2,
		tableNumber: 12,
		userName: "Sophia Martinez",
		userPhone: "+1555123404",
		subtotal: 28.0,
		taxAmount: 2.24,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 31.74,
		createdAtOffsetHours: 3,
		items: [
			{
				itemName: "Smash Double Burger",
				quantity: 1,
				unitPrice: 15.0,
				totalPrice: 15.0,
			},
			{
				itemName: "Sweet Potato Fries",
				quantity: 1,
				unitPrice: 6.5,
				totalPrice: 6.5,
			},
			{
				itemName: "Craft Cola",
				quantity: 2,
				unitPrice: 3.25,
				totalPrice: 6.5,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
		],
	},
	{
		orderNumber: "ORD-3DC35-005",
		orderType: OrderType.TAKEAWAY,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.PREPARING,
		priority: 3,
		userName: "Noah Taylor",
		userPhone: "+1555123405",
		subtotal: 21.0,
		taxAmount: 1.68,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 24.18,
		createdAtOffsetHours: 2,
		items: [
			{
				itemName: "Buffalo Wings (10 pcs)",
				quantity: 1,
				unitPrice: 14.0,
				totalPrice: 14.0,
				addons: [
					{ addonName: "Blue Cheese Dip", price: 1.5 },
					{ addonName: "Ranch Dip", price: 1.5 },
				],
			},
			{
				itemName: "Seasoned Waffle Fries",
				quantity: 1,
				unitPrice: 5.5,
				totalPrice: 5.5,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
		],
	},
	{
		orderNumber: "ORD-3DC35-006",
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.PAY_AT_COUNTER,
		paymentStatus: PaymentStatus.PENDING,
		orderStatus: OrderStatus.READY,
		priority: 1,
		tableNumber: 3,
		userName: "Olivia Anderson",
		userPhone: "+1555123406",
		subtotal: 32.0,
		taxAmount: 2.56,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 36.06,
		createdAtOffsetHours: 1,
		items: [
			{
				itemName: "BBQ Pulled Pork Sandwich",
				quantity: 1,
				unitPrice: 16.0,
				totalPrice: 16.0,
			},
			{
				itemName: "Loaded Mac & Cheese",
				quantity: 1,
				unitPrice: 11.0,
				totalPrice: 11.0,
			},
			{
				itemName: "Lemon Mint Iced Tea",
				quantity: 1,
				unitPrice: 5.0,
				totalPrice: 5.0,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
			OrderStatus.READY,
		],
	},
	{
		orderNumber: "ORD-3DC35-007",
		orderType: OrderType.PRE_ORDER,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.CONFIRMED,
		priority: 2,
		userName: "Lucas Thomas",
		userPhone: "+1555123407",
		subtotal: 55.0,
		taxAmount: 4.4,
		platformFee: 1.5,
		discountAmount: 10.0,
		couponCode: "FLASH10",
		grandTotal: 50.9,
		createdAtOffsetHours: 5,
		items: [
			{
				itemName: "Ribeye Steak (10oz)",
				quantity: 1,
				unitPrice: 38.0,
				totalPrice: 38.0,
			},
			{
				itemName: "Caesar Salad",
				quantity: 1,
				unitPrice: 10.0,
				totalPrice: 10.0,
			},
			{
				itemName: "House Red Wine Glass",
				quantity: 1,
				unitPrice: 7.0,
				totalPrice: 7.0,
			},
		],
		historyStatuses: [OrderStatus.PLACED, OrderStatus.CONFIRMED],
	},
	{
		orderNumber: "ORD-3DC35-008",
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PENDING,
		orderStatus: OrderStatus.PLACED,
		priority: 3,
		tableNumber: 8,
		userName: "Mia White",
		userPhone: "+1555123408",
		subtotal: 18.5,
		taxAmount: 1.48,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 21.48,
		createdAtOffsetHours: 0.5,
		items: [
			{
				itemName: "Crispy Chicken Tenders (5 pcs)",
				quantity: 1,
				unitPrice: 12.0,
				totalPrice: 12.0,
			},
			{
				itemName: "Beer-Battered Onion Rings",
				quantity: 1,
				unitPrice: 6.5,
				totalPrice: 6.5,
			},
		],
		historyStatuses: [OrderStatus.PLACED],
	},
	{
		orderNumber: "ORD-3DC35-009",
		orderType: OrderType.TAKEAWAY,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.REFUNDED,
		orderStatus: OrderStatus.CANCELLED,
		priority: 4,
		userName: "Ethan Harris",
		userPhone: "+1555123409",
		subtotal: 25.0,
		taxAmount: 2.0,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 28.5,
		specialInstructions: "Customer requested cancellation within grace period",
		createdAtOffsetHours: 12,
		items: [
			{
				itemName: "Pepperoni Feast Pizza",
				quantity: 1,
				unitPrice: 20.0,
				totalPrice: 20.0,
			},
			{
				itemName: "Garlic Dipping Sauce",
				quantity: 2,
				unitPrice: 1.5,
				totalPrice: 3.0,
			},
			{
				itemName: "Coke Zero 330ml",
				quantity: 1,
				unitPrice: 2.0,
				totalPrice: 2.0,
			},
		],
		historyStatuses: [OrderStatus.PLACED, OrderStatus.CANCELLED],
	},
	{
		orderNumber: "ORD-3DC35-010",
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.SERVED,
		priority: 2,
		tableNumber: 2,
		userName: "Chloe Clark",
		userPhone: "+1555123410",
		subtotal: 42.0,
		taxAmount: 3.36,
		platformFee: 1.5,
		discountAmount: 0.0,
		grandTotal: 46.86,
		createdAtOffsetHours: 1,
		items: [
			{
				itemName: "Penne alla Vodka",
				quantity: 2,
				unitPrice: 16.0,
				totalPrice: 32.0,
			},
			{
				itemName: "Artisan Tiramisu Cup",
				quantity: 2,
				unitPrice: 5.0,
				totalPrice: 10.0,
			},
		],
		historyStatuses: [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
		],
	},
];

async function main() {
	console.log(
		`\n🌱 [SEED] Starting order data seed for restaurant: ${TARGET_RESTAURANT_ID}...\n`,
	);

	const now = new Date();

	for (const orderData of sampleOrders) {
		const orderCreatedAt = new Date(
			now.getTime() - orderData.createdAtOffsetHours * 60 * 60 * 1000,
		);

		// Clean up existing order if re-seeding to keep idempotency
		const existingOrder = await prisma.order.findUnique({
			where: { orderNumber: orderData.orderNumber },
			select: { id: true },
		});

		if (existingOrder) {
			await prisma.order.delete({
				where: { id: existingOrder.id },
			});
		}

		const order = await prisma.order.create({
			data: {
				orderNumber: orderData.orderNumber,
				restaurantId: orderData.restaurantId ?? TARGET_RESTAURANT_ID,
				userId: randomUUID(),
				userName: orderData.userName,
				userPhone: orderData.userPhone,
				tableNumber: orderData.tableNumber,
				tableId: orderData.tableNumber ? randomUUID() : null,
				orderType: orderData.orderType,
				paymentMode: orderData.paymentMode,
				paymentStatus: orderData.paymentStatus,
				orderStatus: orderData.orderStatus,
				priority: orderData.priority,
				subtotal: orderData.subtotal,
				taxAmount: orderData.taxAmount,
				platformFee: orderData.platformFee,
				discountAmount: orderData.discountAmount,
				couponCode: orderData.couponCode,
				grandTotal: orderData.grandTotal,
				specialInstructions: orderData.specialInstructions,
				createdAt: orderCreatedAt,
				updatedAt: orderCreatedAt,
				items: {
					create: orderData.items.map((item) => ({
						menuItemId: randomUUID(),
						itemName: item.itemName,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice: item.totalPrice,
						specialInstructions: item.specialInstructions,
						createdAt: orderCreatedAt,
						addons: item.addons
							? {
									create: item.addons.map((addon) => ({
										addonId: randomUUID(),
										addonName: addon.addonName,
										price: addon.price,
									})),
								}
							: undefined,
					})),
				},
				statusHistory: {
					create: orderData.historyStatuses.map((status, index) => ({
						previousStatus:
							index > 0 ? (orderData.historyStatuses[index - 1] ?? null) : null,
						currentStatus: status,
						changedBy: "SYSTEM_SEED",
						notes: `Order status advanced to ${status}`,
						createdAt: new Date(
							orderCreatedAt.getTime() + index * 5 * 60 * 1000,
						),
					})),
				},
			},
			include: {
				items: {
					include: {
						addons: true,
					},
				},
				statusHistory: true,
			},
		});

		console.log(
			`  ✓ Created order ${order.orderNumber} (${order.orderStatus}) - $${Number(order.grandTotal).toFixed(2)} [${order.items.length} items]`,
		);
	}

	console.log(
		`\n🎉 [SEED] Successfully seeded ${sampleOrders.length} orders for restaurant ${TARGET_RESTAURANT_ID}!\n`,
	);
}

main()
	.catch((error) => {
		console.error("❌ [SEED ERROR]:", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
