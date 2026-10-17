export const TYPES = {
	PrismaClient: Symbol.for("PrismaClient"),
	CartRepository: Symbol.for("CartRepository"),
	GetCartUseCase: Symbol.for("GetCartUseCase"),
	GetCartController: Symbol.for("GetCartController"),
	RestaurantServiceClient: Symbol.for("RestaurantServiceClient"),
	OrderRepository: Symbol.for("OrderRepository"),
	GetOrdersOverviewUseCase: Symbol.for("GetOrdersOverviewUseCase"),
	GetOrdersOverviewController: Symbol.for("GetOrdersOverviewController"),
};

export default TYPES;
