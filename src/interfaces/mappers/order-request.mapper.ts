import type { CancelOrderInputDto } from "@application/dtos/orders/cancel-order.dto.ts";
import type { GetOrderHistoryInputDto } from "@application/dtos/orders/get-order-history.dto.ts";
import { ORDER_HISTORY_PAGINATION } from "@common/constants/pagination.constants.ts";
import type {
	CancelOrderBody,
	CancelOrderParam,
} from "@interfaces/validation/orders/cancel-order.schema.ts";
import type { OrderHistoryQuery } from "@interfaces/validation/orders/order-history-query.schema.ts";
import type { Request } from "express";

export const OrderRequestMapper = {
	toOrderHistoryInputDto(req: Request): GetOrderHistoryInputDto {
		const query = req.query as unknown as OrderHistoryQuery;
		return {
			customerId: req.user?.userId as string,
			page: query?.page ?? ORDER_HISTORY_PAGINATION.DEFAULT_PAGE,
			limit: query?.limit ?? ORDER_HISTORY_PAGINATION.DEFAULT_LIMIT,
			status: query?.status,
		};
	},

	toCancelOrderInputDto(req: Request): CancelOrderInputDto {
		const params = req.params as unknown as CancelOrderParam;
		const body = req.body as unknown as CancelOrderBody;
		return {
			orderId: params.orderId,
			customerId: req.user?.userId as string,
			cancellationReason: body?.cancellation_reason ?? null,
		};
	},
};

export default OrderRequestMapper;
