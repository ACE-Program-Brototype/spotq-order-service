import type { GetOrderHistoryInputDto } from "@application/dtos/orders/get-order-history.dto.ts";
import { ORDER_HISTORY_PAGINATION } from "@common/constants/pagination.constants.ts";
import type { OrderHistoryQuery } from "@interfaces/validation/order-history-query.schema.ts";
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
};

export default OrderRequestMapper;
