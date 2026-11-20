import type {
	GetStaffOrdersListInputDTO,
	GetStaffOrdersListResponseDTO,
} from "@application/dtos/orders/get-staff-orders.dto.ts";

export interface IGetStaffOrdersListUseCase {
	execute(
		dto: GetStaffOrdersListInputDTO,
	): Promise<GetStaffOrdersListResponseDTO>;
}
