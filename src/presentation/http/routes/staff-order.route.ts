import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { StaffOrderController } from "@presentation/http/controllers/staff-order.controller.ts";
import { restaurantStaffAuthMiddleware } from "@presentation/http/middleware/restaurant-staff-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
	validateRequestQuery,
} from "@presentation/http/middleware/validation.middleware.ts";
import { orderDetailsParamSchema } from "@presentation/http/validators/orders/order-details-param.schema.ts";
import { staffOrdersListQuerySchema } from "@presentation/http/validators/orders/staff-orders-list-query.schema.ts";
import {
	updateOrderStatusBodySchema,
	updateOrderStatusParamSchema,
} from "@presentation/http/validators/orders/update-order-status.schema.ts";
import { restaurantIdParamSchema } from "@presentation/http/validators/restaurant-id-param.schema.ts";
import { STAFF_ORDER_ROUTES } from "@shared/constants/routes.constants.ts";
import { Router } from "express";

const staffOrderRouter: Router = Router();

const staffOrderController = container.get<StaffOrderController>(
	TYPES.StaffOrderController,
);

/**
 * @openapi
 * /staff/{orderId}/status:
 *   patch:
 *     summary: Update order status by staff
 *     tags:
 *       - Staff Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PREPARING, READY, SERVED, COMPLETED, CANCELLED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status or transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden access
 *       404:
 *         description: Order not found
 *       409:
 *         description: Concurrent update conflict
 */
staffOrderRouter.patch(
	STAFF_ORDER_ROUTES.UPDATE_STATUS,
	restaurantStaffAuthMiddleware,
	validateRequestParams(updateOrderStatusParamSchema),
	validateRequestBody(updateOrderStatusBodySchema),
	staffOrderController.updateOrderStatus,
);

/**
 * @openapi
 * /staff/restaurants/{restaurantId}/orders/{orderId}:
 *   get:
 *     summary: Retrieve complete order details for kitchen staff
 *     tags:
 *       - Staff Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       400:
 *         description: Invalid restaurant or order ID format
 *       401:
 *         description: Missing, invalid, or expired JWT
 *       403:
 *         description: Caller is not authorized as Restaurant Staff or lacks access to the restaurant
 *       404:
 *         description: Order does not exist or does not belong to the specified restaurant
 *       500:
 *         description: Unexpected server or data-access failure
 */
staffOrderRouter.get(
	STAFF_ORDER_ROUTES.DETAILS,
	restaurantStaffAuthMiddleware,
	validateRequestParams(orderDetailsParamSchema),
	staffOrderController.getOrderDetails,
);

/**
 * @openapi
 * /staff/restaurants/{restaurantId}/orders:
 *   get:
 *     summary: Retrieve Queue Pro and Self Pro orders for restaurant staff
 *     tags:
 *       - Staff Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by order number
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated statuses (PLACED, CONFIRMED, PREPARING, READY, COMPLETED)
 *       - in: query
 *         name: orderType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [QUEUE_PRO, SELF_PRO]
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         description: Invalid query or parameter format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden access to this restaurant
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
staffOrderRouter.get(
	STAFF_ORDER_ROUTES.RESTAURANT_ORDERS,
	restaurantStaffAuthMiddleware,
	validateRequestParams(restaurantIdParamSchema),
	validateRequestQuery(staffOrdersListQuerySchema),
	staffOrderController.getStaffOrderList,
);

export default staffOrderRouter;
