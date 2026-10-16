export const TYPES = {
	PrismaClient: Symbol.for("PrismaClient"),
	CartRepository: Symbol.for("CartRepository"),
	MenuItemCatalogPort: Symbol.for("MenuItemCatalogPort"),
	GetCartUseCase: Symbol.for("GetCartUseCase"),
	GetCartController: Symbol.for("GetCartController"),
	AddCartItemUseCase: Symbol.for("AddCartItemUseCase"),
	AddCartItemController: Symbol.for("AddCartItemController"),
};

export default TYPES;
