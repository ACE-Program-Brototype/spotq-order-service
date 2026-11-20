import type {
	GetAdminOrdersInputDTO,
	GetAdminOrdersResponseDTO,
} from "@application/dtos/orders/get-admin-orders.dto.ts";

export interface IGetAdminOrdersUseCase {
	execute(dto: GetAdminOrdersInputDTO): Promise<GetAdminOrdersResponseDTO>;
}
