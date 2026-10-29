export interface ActiveQueueDetails {
	queueEntryId: string;
	restaurantId: string;
	userId: string | null;
	queueNumber: string;
	partySize: number;
	status: string;
	position: number | null;
	estimatedWaitMinutes: number | null;
	joinedAt?: string | Date;
}

export interface ActiveQueueUserResponseDTO {
	hasActiveQueue: boolean;
	queueEntry: ActiveQueueDetails | null;
}

// Backwards-compatible alias
export type ActiveQueueUserResponseDto = ActiveQueueUserResponseDTO;
