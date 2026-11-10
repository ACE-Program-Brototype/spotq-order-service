import "reflect-metadata";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IOrderPaymentEventsConsumer } from "@application/ports/messaging/order-payment-events.consumer.port.ts";
import type { IAddBatchCartItemsUseCase } from "@application/ports/use-cases/cart/add-batch-cart-items.use-case.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import type { IGetCheckoutDetailsUseCase } from "@application/ports/use-cases/orders/get-checkout-details.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port";
import type { IGetRestaurantOrdersDetailsUseCase } from "@application/ports/use-cases/orders/get-restaurant-order-details.use-case.port";
import type { IGetRestaurantOrdersListUseCase } from "@application/ports/use-cases/orders/get-restaurant-orders.use-case.port";
import type { IGetStaffOrderDetailsUseCase } from "@application/ports/use-cases/orders/get-staff-order-details.use-case.port.ts";
import type { IGetStaffOrdersListUseCase } from "@application/ports/use-cases/orders/get-staff-orders.use-case.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import type { IUpdateOrderStatusUseCase } from "@application/ports/use-cases/orders/update-order-status.use-case.port.ts";
import { AddBatchCartItemsUseCase } from "@application/use-cases/cart/add-batch-cart-items.use-case.ts";
import { AddCartItemUseCase } from "@application/use-cases/cart/add-cart-item.use-case.ts";
import { ClearCartUseCase } from "@application/use-cases/cart/clear-cart.use-case.ts";
import { GetCartUseCase } from "@application/use-cases/cart/get-cart.use-case.ts";
import { RemoveCartItemUseCase } from "@application/use-cases/cart/remove-cart-item.use-case.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/cart/update-cart-item-quantity.use-case.ts";
import { CancelOrderUseCase } from "@application/use-cases/orders/cancel-order.use-case.ts";
import { GetAdminOrdersUseCase } from "@application/use-cases/orders/get-admin-orders.use-case.ts";
import { GetCheckoutDetailsUseCase } from "@application/use-cases/orders/get-checkout-details.use-case.ts";
import { GetOrderHistoryUseCase } from "@application/use-cases/orders/get-order-history.use-case.ts";
import { GetOrdersOverviewUseCase } from "@application/use-cases/orders/get-orders-overview.use-case.ts";
import { GetRestaurantOrderDetailsUseCase } from "@application/use-cases/orders/get-restaurant-order-details.use-case";
import { GetRestaurantOrdersListUseCase } from "@application/use-cases/orders/get-restaurant-orders.use-case";
import { GetStaffOrderDetailsUseCase } from "@application/use-cases/orders/get-staff-order-details.use-case.ts";
import { GetStaffOrdersListUseCase } from "@application/use-cases/orders/get-staff-orders.use-case.ts";
import { PlaceOrderUseCase } from "@application/use-cases/orders/place-order.use-case.ts";
import { UpdateOrderStatusUseCase } from "@application/use-cases/orders/update-order-status.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { PrismaCartRepository } from "@infrastructure/database/repositories/prisma-cart.repository.ts";
import { PrismaOrderRepository } from "@infrastructure/database/repositories/prisma-order.repository.ts";
import { OrderPaymentEventsConsumer } from "@infrastructure/messaging/order-payment-events.consumer.ts";
import { RabbitMQService } from "@infrastructure/rabbitmq/index.ts";
import { MenuItemCatalogClient } from "@infrastructure/services/menu-item-catalog.client.ts";
import { PaymentServiceClient } from "@infrastructure/services/payment-service.client.ts";
import { QueueServiceClient } from "@infrastructure/services/queue-service.client.ts";
import { RestaurantServiceClient } from "@infrastructure/services/restaurant-service.client.ts";
import { AdminOrderController } from "@presentation/http/controllers/admin-order.controller.ts";
import { CartController } from "@presentation/http/controllers/cart.controller.ts";
import { CustomerOrderController } from "@presentation/http/controllers/customer-order.controller.ts";
import { RestaurantOrderController } from "@presentation/http/controllers/restaurant-order.controller.ts";
import { StaffOrderController } from "@presentation/http/controllers/staff-order.controller.ts";
import { Container } from "inversify";

const container = new Container();

container.bind(TYPES.PrismaClient).toConstantValue(prisma);

container
	.bind<ICartRepository>(TYPES.CartRepository)
	.to(PrismaCartRepository)
	.inSingletonScope();

container
	.bind<IMenuItemCatalogPort>(TYPES.MenuItemCatalogPort)
	.to(MenuItemCatalogClient)
	.inSingletonScope();

container
	.bind<IGetCartUseCase>(TYPES.GetCartUseCase)
	.to(GetCartUseCase)
	.inSingletonScope();

container
	.bind<IAddCartItemUseCase>(TYPES.AddCartItemUseCase)
	.to(AddCartItemUseCase)
	.inSingletonScope();

container
	.bind<IAddBatchCartItemsUseCase>(TYPES.AddBatchCartItemsUseCase)
	.to(AddBatchCartItemsUseCase)
	.inSingletonScope();

container
	.bind<IUpdateCartItemQuantityUseCase>(TYPES.UpdateCartItemQuantityUseCase)
	.to(UpdateCartItemQuantityUseCase)
	.inSingletonScope();

container
	.bind<IRemoveCartItemUseCase>(TYPES.RemoveCartItemUseCase)
	.to(RemoveCartItemUseCase)
	.inSingletonScope();

container
	.bind<IClearCartUseCase>(TYPES.ClearCartUseCase)
	.to(ClearCartUseCase)
	.inSingletonScope();

container
	.bind<CartController>(TYPES.CartController)
	.to(CartController)
	.inSingletonScope();

container
	.bind<IRestaurantServiceClient>(TYPES.RestaurantServiceClient)
	.to(RestaurantServiceClient)
	.inSingletonScope();

container
	.bind<IOrderRepository>(TYPES.OrderRepository)
	.to(PrismaOrderRepository)
	.inSingletonScope();

container
	.bind<IGetOrdersOverviewUseCase>(TYPES.GetOrdersOverviewUseCase)
	.to(GetOrdersOverviewUseCase)
	.inSingletonScope();

container
	.bind<RestaurantOrderController>(TYPES.RestaurantOrderController)
	.to(RestaurantOrderController)
	.inSingletonScope();

container
	.bind<IGetOrderHistoryUseCase>(TYPES.GetOrderHistoryUseCase)
	.to(GetOrderHistoryUseCase)
	.inSingletonScope();

container
	.bind<ICancelOrderUseCase>(TYPES.CancelOrderUseCase)
	.to(CancelOrderUseCase)
	.inSingletonScope();

container
	.bind<CustomerOrderController>(TYPES.CustomerOrderController)
	.to(CustomerOrderController)
	.inSingletonScope();

container
	.bind<IQueueServiceClient>(TYPES.QueueServiceClient)
	.to(QueueServiceClient)
	.inSingletonScope();

container
	.bind<IPaymentServiceClient>(TYPES.PaymentServiceClient)
	.to(PaymentServiceClient)
	.inSingletonScope();

container
	.bind<RabbitMQService>(TYPES.RabbitMQService)
	.to(RabbitMQService)
	.inSingletonScope();

container
	.bind<IOrderPaymentEventsConsumer>(TYPES.OrderPaymentEventsConsumer)
	.to(OrderPaymentEventsConsumer)
	.inSingletonScope();

container
	.bind<IPlaceOrderUseCase>(TYPES.PlaceOrderUseCase)
	.to(PlaceOrderUseCase)
	.inSingletonScope();

container
	.bind<IGetCheckoutDetailsUseCase>(TYPES.GetCheckoutDetailsUseCase)
	.to(GetCheckoutDetailsUseCase)
	.inSingletonScope();

container
	.bind<IGetRestaurantOrdersListUseCase>(TYPES.GetRestaurantOrdersListUseCase)
	.to(GetRestaurantOrdersListUseCase)
	.inSingletonScope();

container
	.bind<IGetRestaurantOrdersDetailsUseCase>(
		TYPES.GetRestaurantOrderDetailsUseCase,
	)
	.to(GetRestaurantOrderDetailsUseCase)
	.inSingletonScope();

container
	.bind<IGetStaffOrderDetailsUseCase>(TYPES.GetStaffOrderDetailsUseCase)
	.to(GetStaffOrderDetailsUseCase)
	.inSingletonScope();

container
	.bind<IGetStaffOrdersListUseCase>(TYPES.GetStaffOrdersListUseCase)
	.to(GetStaffOrdersListUseCase)
	.inSingletonScope();

container
	.bind(TYPES.GetAdminOrdersUseCase)
	.to(GetAdminOrdersUseCase)
	.inSingletonScope();

container
	.bind<AdminOrderController>(TYPES.AdminOrderController)
	.to(AdminOrderController)
	.inSingletonScope();

container
	.bind<IUpdateOrderStatusUseCase>(TYPES.UpdateOrderStatusUseCase)
	.to(UpdateOrderStatusUseCase)
	.inSingletonScope();

container
	.bind<StaffOrderController>(TYPES.StaffOrderController)
	.to(StaffOrderController)
	.inSingletonScope();

export const rabbitMQService = container.get<RabbitMQService>(
	TYPES.RabbitMQService,
);
export const orderPaymentEventsConsumer =
	container.get<IOrderPaymentEventsConsumer>(TYPES.OrderPaymentEventsConsumer);

export { container };
