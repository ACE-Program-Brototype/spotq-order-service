import type {
	GetCustomerOrderDetailsInputDTO,
	GetCustomerOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-customer-order-details.dto.ts";

export interface IGetCustomerOrderDetailsUseCase {
	execute(
		dto: GetCustomerOrderDetailsInputDTO,
	): Promise<GetCustomerOrderDetailsOutputDTO>;
}
