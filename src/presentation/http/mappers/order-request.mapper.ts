import type { CancelOrderInputDTO } from "@application/dtos/orders/cancel-order.dto.ts";
import type { GetOrderHistoryInputDTO } from "@application/dtos/orders/get-order-history.dto.ts";
import type {
	CancelOrderBody,
	CancelOrderParam,
} from "@presentation/http/validators/orders/cancel-order.schema.ts";
import type { OrderHistoryQuery } from "@presentation/http/validators/orders/order-history-query.schema.ts";
import { ORDER_HISTORY_PAGINATION } from "@shared/constants/pagination.constants.ts";
import type { Request } from "express";

export const OrderRequestMapper = {
	toOrderHistoryInputDTO(req: Request): GetOrderHistoryInputDTO {
		const query = req.query as unknown as OrderHistoryQuery;
		return {
			customerId: req.user?.userId as string,
			page: query?.page ?? ORDER_HISTORY_PAGINATION.DEFAULT_PAGE,
			limit: query?.limit ?? ORDER_HISTORY_PAGINATION.DEFAULT_LIMIT,
			status: query?.status,
		};
	},

	toCancelOrderInputDTO(req: Request): CancelOrderInputDTO {
		const params = req.params as unknown as CancelOrderParam;
		const body = req.body as unknown as CancelOrderBody;
		return {
			orderId: params.orderId,
			customerId: req.user?.userId as string,
			cancellationReason: body?.cancellation_reason ?? null,
		};
	},

	// Backwards-compatible aliases for caller migration
	toOrderHistoryInputDto(req: Request): GetOrderHistoryInputDTO {
		return this.toOrderHistoryInputDTO(req);
	},

	toCancelOrderInputDto(req: Request): CancelOrderInputDTO {
		return this.toCancelOrderInputDTO(req);
	},
};

export default OrderRequestMapper;
