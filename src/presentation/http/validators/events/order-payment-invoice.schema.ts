import type {
	OrderInvoiceDataDTO,
	OrderPaymentInvoiceEventDTO,
	OrderPaymentInvoiceFinancialsDTO,
	OrderPaymentInvoiceItemAddonDTO,
	OrderPaymentInvoiceItemDTO,
} from "@application/dtos/events/order-payment-invoice-event.dto.ts";
import { ORDER_EVENTS } from "@shared/constants/events.constants.ts";
import { z } from "zod";

export const orderPaymentInvoiceItemAddonSchema: z.ZodType<OrderPaymentInvoiceItemAddonDTO> =
	z.object({
		addonId: z.string(),
		addonName: z.string(),
		price: z.number(),
	});

export const orderPaymentInvoiceItemSchema: z.ZodType<OrderPaymentInvoiceItemDTO> =
	z.object({
		menuItemId: z.string(),
		itemName: z.string(),
		variantId: z.string().nullable(),
		variantName: z.string().nullable(),
		quantity: z.number().int().positive(),
		unitPrice: z.number(),
		totalPrice: z.number(),
		specialInstructions: z.string().nullable(),
		addons: z.array(orderPaymentInvoiceItemAddonSchema),
	});

export const orderPaymentInvoiceFinancialsSchema: z.ZodType<OrderPaymentInvoiceFinancialsDTO> =
	z.object({
		subtotal: z.number(),
		taxAmount: z.number(),
		taxPercent: z.number().optional(),
		platformFee: z.number(),
		discountAmount: z.number(),
		grandTotal: z.number(),
		amountPaise: z.number().int().positive(),
	});

export const orderInvoiceDataSchema: z.ZodType<OrderInvoiceDataDTO> = z.object({
	orderId: z.string(),
	orderNumber: z.string(),
	paymentId: z.string().nullable(),
	restaurantId: z.string(),
	restaurantName: z.string().nullable(),
	customerId: z.string().nullable(),
	customerName: z.string().nullable(),
	customerPhone: z.string().nullable(),
	orderingMode: z.string(),
	tableNumber: z.number().nullable(),
	queueEntryId: z.string().nullable().optional(),
	paymentMode: z.string(),
	paymentStatus: z.string(),
	orderStatus: z.string(),
	currency: z.string(),
	specialInstructions: z.string().nullable().optional(),
	financials: orderPaymentInvoiceFinancialsSchema,
	items: z.array(orderPaymentInvoiceItemSchema),
	createdAt: z.string(),
	confirmedAt: z.string(),
});

export const orderPaymentInvoiceEventSchema: z.ZodType<OrderPaymentInvoiceEventDTO> =
	z.object({
		eventId: z.string(),
		eventType: z.literal(ORDER_EVENTS.PAYMENT_INVOICE),
		aggregateId: z.string(),
		timestamp: z.string(),
		orderData: orderInvoiceDataSchema,
	});

// Aliases for compatibility
export const orderConfirmedEventSchema = orderPaymentInvoiceEventSchema;
