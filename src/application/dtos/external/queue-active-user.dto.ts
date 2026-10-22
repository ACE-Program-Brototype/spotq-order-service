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

export interface ActiveQueueUserResponseDto {
	hasActiveQueue: boolean;
	queueEntry: ActiveQueueDetails | null;
}
