import { CART_LIMITS } from "@domain/constants/cart.constants.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import {
	CartExpiredError,
	DifferentRestaurantCartError,
	ForbiddenCartAccessError,
	InvalidCartQuantityError,
} from "@domain/errors/cart.errors.ts";
import type {
	BatchCartItemCandidate,
	CartProps,
	MergedBatchCartItem,
} from "@domain/types/cart.types.ts";

export class Cart {
	public readonly id: string;
	public readonly restaurantId: string;
	public readonly userId: string;
	public status: CartStatus;
	public readonly expiresAt: Date;
	public readonly items: CartItem[];
	public readonly createdAt: Date;
	public readonly updatedAt: Date;

	constructor(props: CartProps) {
		this.id = props.id;
		this.restaurantId = props.restaurantId;
		this.userId = props.userId;
		this.status = props.status;
		this.expiresAt = props.expiresAt;
		this.items = (props.items ?? []).map((item) => new CartItem(item));
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? new Date();
	}

	public static mergeBatchItems(
		candidates: BatchCartItemCandidate[],
	): MergedBatchCartItem[] {
		const mergedItems: MergedBatchCartItem[] = [];

		for (const candidate of candidates) {
			if (
				candidate.quantity < CART_LIMITS.MIN_QUANTITY ||
				candidate.quantity > CART_LIMITS.MAX_QUANTITY
			) {
				throw new InvalidCartQuantityError();
			}

			const normalizedVariantId = candidate.variantId ?? null;
			const normalizedAddonIds = [...(candidate.addonIds ?? [])].sort();
			const normalizedInstructions =
				candidate.specialInstructions?.trim() || null;
			const normalizedAddonKey = normalizedAddonIds.join(",");

			const existingMatch = mergedItems.find((existing) => {
				return (
					existing.menuItemId === candidate.menuItemId &&
					existing.variantId === normalizedVariantId &&
					existing.specialInstructions === normalizedInstructions &&
					existing.addonIds.join(",") === normalizedAddonKey
				);
			});

			if (existingMatch) {
				const nextQuantity = existingMatch.quantity + candidate.quantity;
				if (nextQuantity > CART_LIMITS.MAX_QUANTITY) {
					throw new InvalidCartQuantityError();
				}
				existingMatch.quantity = nextQuantity;
			} else {
				mergedItems.push({
					menuItemId: candidate.menuItemId,
					variantId: normalizedVariantId,
					addonIds: normalizedAddonIds,
					quantity: candidate.quantity,
					specialInstructions: normalizedInstructions,
				});
			}
		}

		return mergedItems;
	}

	public isExpired(now: Date = new Date()): boolean {
		return (
			this.status === CartStatus.EXPIRED ||
			now.getTime() > this.expiresAt.getTime()
		);
	}

	public validateAccess(userId: string): void {
		if (this.userId !== userId) {
			throw new ForbiddenCartAccessError();
		}
	}

	public validateActive(now: Date = new Date()): void {
		if (this.isExpired(now)) {
			throw new CartExpiredError();
		}
	}

	public validateRestaurant(restaurantId: string): void {
		if (this.items.length > 0 && this.restaurantId !== restaurantId) {
			throw new DifferentRestaurantCartError();
		}
	}

	public findMatchingItem(
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
		specialInstructions?: string | null,
	): CartItem | undefined {
		return this.items.find((item) =>
			item.matchesConfiguration(
				menuItemId,
				variantId,
				addonIds,
				specialInstructions,
			),
		);
	}

	public calculateSubtotal(): number {
		const total = this.items.reduce(
			(sum, item) => sum + item.calculateLineTotal(),
			0,
		);
		return Number(total.toFixed(2));
	}

	public calculateItemCount(): number {
		return this.items.reduce((sum, item) => sum + item.quantity, 0);
	}
}
