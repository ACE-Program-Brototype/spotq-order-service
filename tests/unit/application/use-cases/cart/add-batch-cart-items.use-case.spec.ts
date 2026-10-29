import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import { AddBatchCartItemsUseCase } from "@application/use-cases/cart/add-batch-cart-items.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { InvalidCartQuantityError } from "@domain/errors/invalid-cart-quantity.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	ReplaceCartBatchInput,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";

class MockBatchCartRepository implements ICartRepository {
	public lastReplacedInput: ReplaceCartBatchInput | null = null;

	public async findById(_cartId: string): Promise<Cart | null> {
		return null;
	}

	public async findActiveByUserId(_userId: string): Promise<Cart | null> {
		return null;
	}

	public async update(
		_cartId: string,
		_data: UpdateCartInput,
	): Promise<Cart | null> {
		return null;
	}

	public async addItem(_input: AddItemInput): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async replaceCartItemsBatch(
		input: ReplaceCartBatchInput,
	): Promise<Cart> {
		this.lastReplacedInput = input;
		const cartId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 86400000);

		const items = input.items.map(
			(item, index) =>
				new CartItem({
					id: `ci-${index + 1}`,
					cartId,
					menuItemId: item.menuItemId,
					menuItemName: item.menuItemName,
					variantId: item.variantId,
					variantName: item.variantName,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					totalPrice: item.totalPrice,
					specialInstructions: item.specialInstructions,
					addons: item.itemAddons.map(
						(addon, addonIdx) =>
							new CartItemAddon({
								id: `cia-${index + 1}-${addonIdx + 1}`,
								cartItemId: `ci-${index + 1}`,
								addonId: addon.addonId,
								addonName: addon.name,
								price: addon.price,
							}),
					),
					createdAt: now,
					updatedAt: now,
				}),
		);

		return new Cart({
			id: cartId,
			restaurantId: input.restaurantId,
			userId: input.userId,
			status: CartStatus.ACTIVE,
			expiresAt,
			items,
			createdAt: now,
			updatedAt: now,
		});
	}

	public async updateItemQuantity(
		_cartId: string,
		_cartItemId: string,
		_quantity: number,
	): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async removeItem(_cartId: string, _cartItemId: string): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async clearCart(_cartId: string): Promise<Cart> {
		throw new Error("Not implemented");
	}
}

class MockCatalogPort implements IMenuItemCatalogPort {
	public items: Map<string, CatalogItemDetails> = new Map();

	public async getItemDetails(
		_restaurantId: string,
		menuItemId: string,
	): Promise<CatalogItemDetails | null> {
		return this.items.get(menuItemId) ?? null;
	}
}

describe("AddBatchCartItemsUseCase", () => {
	const restaurantId = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const userId = "7c1a9d44-22f4-4ab8-91ef-123456789abc";
	const paneerId = "01e2f3a4-1234-4a2e-8e55-321456987010";
	const variantId = "01e2f3a4-1234-4a2e-8e55-321456987020";
	const addonId = "01e2f3a4-1234-4a2e-8e55-321456987030";
	const naanId = "01e2f3a4-1234-4a2e-8e55-321456987040";

	it("should merge duplicate customizations in the batch, validate catalog, replace cart items, and return full DTO with cartItemId", async () => {
		const cartRepo = new MockBatchCartRepository();
		const catalogPort = new MockCatalogPort();

		catalogPort.items.set(paneerId, {
			menuItemId: paneerId,
			name: "Paneer Butter Masala",
			price: 300,
			isAvailable: true,
			variant: {
				variantId,
				name: "Full",
				price: 350,
				isAvailable: true,
			},
			addons: [
				{
					addonId,
					name: "Extra Butter",
					price: 25,
					isAvailable: true,
				},
			],
		});

		catalogPort.items.set(naanId, {
			menuItemId: naanId,
			name: "Garlic Naan",
			price: 100,
			isAvailable: true,
			addons: [],
		});

		const useCase = new AddBatchCartItemsUseCase(cartRepo, catalogPort);

		const result = await useCase.execute({
			authenticatedUserId: userId,
			restaurantId,
			items: [
				{
					menuItemId: paneerId,
					variantId,
					addonIds: [addonId],
					quantity: 1,
					specialInstructions: "Extra spicy",
				},
				{
					menuItemId: paneerId,
					variantId,
					addonIds: [addonId],
					quantity: 1,
					specialInstructions: " Extra spicy ",
				},
				{
					menuItemId: naanId,
					variantId: null,
					addonIds: [],
					quantity: 1,
					specialInstructions: null,
				},
			],
		});

		assert.equal(result.restaurantId, restaurantId);
		assert.equal(result.userId, userId);
		assert.equal(result.itemCount, 3);
		assert.equal(result.subtotal, 850);
		assert.equal(result.items.length, 2);
		assert.equal(result.items[0]?.cartItemId, "ci-1");
		assert.equal(result.items[0]?.quantity, 2);
		assert.equal(result.items[0]?.unitPrice, 350);
		assert.equal(result.items[0]?.totalPrice, 750);
		assert.equal(result.items[0]?.addons[0]?.addonId, addonId);
		assert.equal(result.items[1]?.cartItemId, "ci-2");
		assert.equal(result.items[1]?.totalPrice, 100);
	});

	it("should throw MenuItemNotFoundError when any item is missing from catalog", async () => {
		const cartRepo = new MockBatchCartRepository();
		const catalogPort = new MockCatalogPort();
		const useCase = new AddBatchCartItemsUseCase(cartRepo, catalogPort);

		await assert.rejects(
			async () =>
				useCase.execute({
					authenticatedUserId: userId,
					restaurantId,
					items: [
						{
							menuItemId: paneerId,
							quantity: 1,
						},
					],
				}),
			MenuItemNotFoundError,
		);
	});

	it("should throw ItemUnavailableError when an item in the batch is out of stock", async () => {
		const cartRepo = new MockBatchCartRepository();
		const catalogPort = new MockCatalogPort();

		catalogPort.items.set(paneerId, {
			menuItemId: paneerId,
			name: "Paneer Butter Masala",
			price: 300,
			isAvailable: false,
			addons: [],
		});

		const useCase = new AddBatchCartItemsUseCase(cartRepo, catalogPort);

		await assert.rejects(
			async () =>
				useCase.execute({
					authenticatedUserId: userId,
					restaurantId,
					items: [
						{
							menuItemId: paneerId,
							quantity: 1,
						},
					],
				}),
			ItemUnavailableError,
		);
	});

	it("should throw InvalidCartQuantityError when merged batch quantity exceeds 20", async () => {
		const cartRepo = new MockBatchCartRepository();
		const catalogPort = new MockCatalogPort();
		const useCase = new AddBatchCartItemsUseCase(cartRepo, catalogPort);

		await assert.rejects(
			async () =>
				useCase.execute({
					authenticatedUserId: userId,
					restaurantId,
					items: [
						{
							menuItemId: paneerId,
							quantity: 12,
						},
						{
							menuItemId: paneerId,
							quantity: 10,
						},
					],
				}),
			InvalidCartQuantityError,
		);
	});
});
