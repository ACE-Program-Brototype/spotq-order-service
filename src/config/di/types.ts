export const TYPES = {
	PrismaClient: Symbol.for("PrismaClient"),
	CartRepository: Symbol.for("CartRepository"),
	MenuItemCatalogPort: Symbol.for("MenuItemCatalogPort"),
	GetCartUseCase: Symbol.for("GetCartUseCase"),
	GetCartController: Symbol.for("GetCartController"),
	AddCartItemUseCase: Symbol.for("AddCartItemUseCase"),
	AddCartItemController: Symbol.for("AddCartItemController"),
	UpdateCartItemQuantityUseCase: Symbol.for("UpdateCartItemQuantityUseCase"),
	UpdateCartItemQuantityController: Symbol.for(
		"UpdateCartItemQuantityController",
	),
	RemoveCartItemUseCase: Symbol.for("RemoveCartItemUseCase"),
	RemoveCartItemController: Symbol.for("RemoveCartItemController"),
	ClearCartUseCase: Symbol.for("ClearCartUseCase"),
	ClearCartController: Symbol.for("ClearCartController"),
	CartController: Symbol.for("CartController"),
};

export default TYPES;
