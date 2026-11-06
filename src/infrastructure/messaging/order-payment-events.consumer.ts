import type { OrderPaymentInvoiceEventDTO } from "@application/dtos/events/order-payment-invoice-event.dto.ts";
import type { IOrderPaymentEventsConsumer } from "@application/ports/messaging/order-payment-events.consumer.port.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import logger from "@infrastructure/observability/logger.ts";
import type { RabbitMQService } from "@infrastructure/rabbitmq/rabbitmq.service.ts";
import {
	basePaymentEventSchema,
	paymentOrderCapturedEventSchema,
	paymentOrderFailedEventSchema,
} from "@presentation/http/validators/events/payment-event.schema.ts";
import {
	ORDER_EVENTS,
	PAYMENT_EVENTS,
	QUEUES,
} from "@shared/constants/events.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class OrderPaymentEventsConsumer implements IOrderPaymentEventsConsumer {
	constructor(
		@inject(TYPES.RabbitMQService)
		private readonly rabbitMQService: RabbitMQService,
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async start(): Promise<void> {
		logger.info(
			{ queue: QUEUES.ORDER_EVENTS },
			"Registering RabbitMQ consumer for order payment events",
		);

		await this.rabbitMQService.consumeFromQueue(
			QUEUES.ORDER_EVENTS,
			this.handleMessage.bind(this),
		);
	}

	public async handleMessage(rawMessage: unknown): Promise<void> {
		const baseResult = basePaymentEventSchema.safeParse(rawMessage);
		if (!baseResult.success) {
			logger.warn(
				{ rawMessage, errors: baseResult.error.format() },
				"Ignored malformed or unparseable payment event message",
			);
			return;
		}

		const { eventType } = baseResult.data;

		switch (eventType) {
			case PAYMENT_EVENTS.ORDER_CAPTURED:
				await this.handleOrderCaptured(rawMessage);
				break;
			case PAYMENT_EVENTS.ORDER_FAILED:
				await this.handleOrderFailed(rawMessage);
				break;
			default:
				logger.debug(
					{ eventType },
					"Ignored payment event with unhandled event type",
				);
				break;
		}
	}

	private async handleOrderCaptured(rawMessage: unknown): Promise<void> {
		try {
			const parsed = paymentOrderCapturedEventSchema.safeParse(rawMessage);
			if (!parsed.success) {
				logger.warn(
					{ rawMessage, errors: parsed.error.format() },
					"Invalid payment.order.captured payload structure",
				);
				return;
			}

			const event = parsed.data;
			const order = await this.orderRepository.findById(event.orderId);

			if (!order) {
				logger.warn(
					{ orderId: event.orderId, eventId: event.eventId },
					"Order not found for payment.order.captured event",
				);
				return;
			}

			// Idempotency check: order already finalized
			if (
				order.paymentStatus === PaymentStatus.PAID &&
				order.orderStatus === OrderStatus.CONFIRMED
			) {
				logger.info(
					{ orderId: order.id },
					"Order is already marked as PAID and CONFIRMED (idempotent duplicate event)",
				);
				return;
			}

			// If order was cancelled or failed prior to capture, do not capture payment
			if (
				order.orderStatus === OrderStatus.CANCELLED ||
				order.paymentStatus === PaymentStatus.FAILED
			) {
				logger.error(
					{
						orderId: order.id,
						paymentId: event.paymentId,
						orderStatus: order.orderStatus,
						paymentStatus: order.paymentStatus,
					},
					"Ignored payment.order.captured because order is already CANCELLED or FAILED",
				);
				return;
			}

			// Atomically update paymentStatus, orderStatus, audit history, and paymentId in one transaction
			await this.orderRepository.updatePaymentAndOrderStatus(
				order.id,
				PaymentStatus.PAID,
				OrderStatus.CONFIRMED,
				"Payment captured via gateway",
				event.paymentId,
			);

			// Publish order.payment.invoice event to RabbitMQ with complete orderData object
			const now = new Date().toISOString();
			const invoiceEvent: OrderPaymentInvoiceEventDTO = {
				eventId: crypto.randomUUID(),
				eventType: ORDER_EVENTS.PAYMENT_INVOICE,
				aggregateId: order.id,
				timestamp: now,
				orderData: {
					orderId: order.id,
					orderNumber: order.orderNumber,
					paymentId: event.paymentId ?? order.paymentId,
					restaurantId: order.restaurantId,
					restaurantName: order.restaurantName,
					customerId: order.userId,
					customerName: order.userName,
					customerPhone: order.userPhone,
					orderingMode: order.orderingMode,
					tableNumber: order.tableNumber,
					queueEntryId: order.queueEntryId,
					paymentMode: order.paymentMode,
					paymentStatus: PaymentStatus.PAID,
					orderStatus: OrderStatus.CONFIRMED,
					currency: event.currency ?? "INR",
					specialInstructions: order.specialInstructions,
					financials: {
						subtotal: order.subtotal,
						taxAmount: order.taxAmount,
						platformFee: order.platformFee,
						discountAmount: order.discountAmount,
						grandTotal: order.grandTotal,
						amountPaise: Math.round(order.grandTotal * 100),
					},
					items: order.items.map((item) => ({
						menuItemId: item.menuItemId,
						itemName: item.itemName,
						variantId: item.variantId,
						variantName: item.variantName,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice: item.totalPrice,
						specialInstructions: item.specialInstructions,
						addons: item.addons.map((addon) => ({
							addonId: addon.addonId,
							addonName: addon.addonName,
							price: addon.price,
						})),
					})),
					createdAt: order.createdAt.toISOString(),
					confirmedAt: now,
				},
			};

			await this.rabbitMQService.publishToQueue(
				QUEUES.PAYMENT_EVENTS,
				invoiceEvent,
			);

			logger.info(
				{
					orderId: order.id,
					paymentId: event.paymentId,
					eventId: invoiceEvent.eventId,
					queue: QUEUES.PAYMENT_EVENTS,
				},
				"Order finalized to CONFIRMED and published order.payment.invoice event to payment-events queue for invoice creation",
			);
		} catch (error) {
			logger.error(
				{ err: error, rawMessage },
				"Error occurred while processing payment.order.captured event in consumer",
			);
			throw error;
		}
	}

	private async handleOrderFailed(rawMessage: unknown): Promise<void> {
		try {
			const parsed = paymentOrderFailedEventSchema.safeParse(rawMessage);
			if (!parsed.success) {
				logger.warn(
					{ rawMessage, errors: parsed.error.format() },
					"Invalid payment.order.failed payload structure",
				);
				return;
			}

			const event = parsed.data;
			const order = await this.orderRepository.findById(event.orderId);

			if (!order) {
				logger.warn(
					{ orderId: event.orderId, eventId: event.eventId },
					"Order not found for payment.order.failed event",
				);
				return;
			}

			// Idempotency check: already cancelled and failed
			if (
				order.paymentStatus === PaymentStatus.FAILED &&
				order.orderStatus === OrderStatus.CANCELLED
			) {
				logger.info(
					{ orderId: order.id },
					"Order is already marked as FAILED and CANCELLED (idempotent duplicate event)",
				);
				return;
			}

			// Prevent cancelling an already confirmed/paid order
			if (order.paymentStatus === PaymentStatus.PAID) {
				logger.warn(
					{ orderId: order.id },
					"Ignored payment.order.failed because order is already marked as PAID",
				);
				return;
			}

			const failureReason = event.failureReason ?? "Payment failed on gateway";

			await this.orderRepository.updatePaymentAndOrderStatus(
				order.id,
				PaymentStatus.FAILED,
				OrderStatus.CANCELLED,
				failureReason,
			);

			logger.info(
				{ orderId: order.id, failureReason },
				"Order marked as FAILED and CANCELLED via payment.order.failed",
			);
		} catch (error) {
			logger.error(
				{ err: error, rawMessage },
				"Error occurred while processing payment.order.failed event in consumer",
			);
			throw error;
		}
	}
}
