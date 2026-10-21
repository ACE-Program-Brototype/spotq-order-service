export const TYPES = {
	PrismaClient: Symbol.for("PrismaClient"),
	CartRepository: Symbol.for("CartRepository"),
	MenuItemCatalogPort: Symbol.for("MenuItemCatalogPort"),
	GetCartUseCase: Symbol.for("GetCartUseCase"),
	AddCartItemUseCase: Symbol.for("AddCartItemUseCase"),
	UpdateCartItemQuantityUseCase: Symbol.for("UpdateCartItemQuantityUseCase"),
	RemoveCartItemUseCase: Symbol.for("RemoveCartItemUseCase"),
	ClearCartUseCase: Symbol.for("ClearCartUseCase"),
	CartController: Symbol.for("CartController"),
	GetCartController: Symbol.for("GetCartController"),
	RestaurantServiceClient: Symbol.for("RestaurantServiceClient"),
	OrderRepository: Symbol.for("OrderRepository"),
	GetOrdersOverviewUseCase: Symbol.for("GetOrdersOverviewUseCase"),
	RestaurantOrderController: Symbol.for("RestaurantOrderController"),
	GetOrderHistoryUseCase: Symbol.for("GetOrderHistoryUseCase"),
	CustomerOrderController: Symbol.for("CustomerOrderController"),
};

export default TYPES;
