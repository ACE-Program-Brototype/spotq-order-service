import type {
	GetStaffOrderDetailsInputDTO,
	GetStaffOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-staff-order-details.dto.ts";

export interface IGetStaffOrderDetailsUseCase {
	execute(
		dto: GetStaffOrderDetailsInputDTO,
	): Promise<GetStaffOrderDetailsOutputDTO>;
}
