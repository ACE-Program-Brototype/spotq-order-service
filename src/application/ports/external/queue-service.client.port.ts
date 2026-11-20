import type { ActiveQueueUserResponseDTO } from "@application/dtos/external/queue-active-user.dto.ts";

export interface IQueueServiceClient {
	checkUserActiveQueue(
		restaurantId: string,
		userId: string,
	): Promise<ActiveQueueUserResponseDTO | null>;
}
