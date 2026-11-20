export interface IOrderPaymentEventsConsumer {
	start(): Promise<void>;
	handleMessage(rawMessage: unknown): Promise<void>;
}
