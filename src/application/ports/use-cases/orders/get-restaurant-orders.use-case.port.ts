import type { GetRestaurantOrdersListInputDTO, GetRestaurantOrdersListResponseDTO } from "@application/dtos/orders/get-restaurant-orders.dto";

export interface IGetRestaurantOrdersListUseCase{
    execute(
        dto:GetRestaurantOrdersListInputDTO
    ):Promise<GetRestaurantOrdersListResponseDTO>
};