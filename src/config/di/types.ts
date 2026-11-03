import { GetRestaurantOrderDetailsMapper } from "@application/mappers/orders/get-restaurant-order-details.mapper";
import { GetRestaurantOrderDetailsUseCase } from "@application/use-cases/orders/get-restaurant-order-details.use-case";
import { GetRestaurantOrdersListUseCase } from "@application/use-cases/orders/get-restaurant-orders.use-case";

export const TYPES = {
	PrismaClient: Symbol.for("PrismaClient"),
	CartRepository: Symbol.for("CartRepository"),
	MenuItemCatalogPort: Symbol.for("MenuItemCatalogPort"),
	GetCartUseCase: Symbol.for("GetCartUseCase"),
	AddCartItemUseCase: Symbol.for("AddCartItemUseCase"),
	AddBatchCartItemsUseCase: Symbol.for("AddBatchCartItemsUseCase"),
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
	CancelOrderUseCase: Symbol.for("CancelOrderUseCase"),
	CustomerOrderController: Symbol.for("CustomerOrderController"),
	QueueServiceClient: Symbol.for("QueueServiceClient"),
	PlaceOrderUseCase: Symbol.for("PlaceOrderUseCase"),
	GetCheckoutDetailsUseCase: Symbol.for("GetCheckoutDetailsUseCase"),
	GetRestaurantOrdersListUseCase: Symbol.for("GetRestaurantOrdersListUsecase"),
	GetRestaurantOrderDetailsUseCase: Symbol.for(
		"GetRestaurantOrderDetailsUseCase",
	),
};

export default TYPES;
