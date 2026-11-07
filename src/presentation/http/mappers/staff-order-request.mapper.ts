import type { GetStaffOrderDetailsInputDTO } from "@application/dtos/orders/get-staff-order-details.dto.ts";
import type { UpdateOrderStatusInputDTO } from "@application/dtos/orders/update-order-status.dto.ts";
import type { OrderDetailsParam } from "@presentation/http/validators/orders/order-details-param.schema.ts";
import type {
	UpdateOrderStatusBody,
	UpdateOrderStatusParam,
} from "@presentation/http/validators/orders/update-order-status.schema.ts";
import type { Request } from "express";

export const StaffOrderRequestMapper = {
	toUpdateOrderStatusInputDto(req: Request): UpdateOrderStatusInputDTO {
		const params = req.params as unknown as UpdateOrderStatusParam;
		const body = req.body as unknown as UpdateOrderStatusBody;
		const user = req.user;

		return {
			orderId: params.orderId,
			status: body.status,
			restaurantId: user?.restaurantId as string,
			actorId: user?.userId as string,
			notes: body.notes ?? null,
		};
	},

	toGetStaffOrderDetailsInputDto(req: Request): GetStaffOrderDetailsInputDTO {
		const params = req.params as unknown as OrderDetailsParam;

		return {
			restaurantId: params.restaurantId,
			orderId: params.orderId,
		};
	},
};
