import type {
	GetStaffOrderDetailsInputDTO,
	StaffOrderDetailsResponseDTO,
} from "@application/dtos/orders/get-staff-order-details.dto.ts";

export interface IGetStaffOrderDetailsUseCase {
	execute(
		dto: GetStaffOrderDetailsInputDTO,
	): Promise<StaffOrderDetailsResponseDTO>;
}
