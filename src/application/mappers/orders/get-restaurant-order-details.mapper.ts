import type { GetRestaurantOrderDetailsResponseDTO } from "@application/dtos/orders/get-restaurant-order-details.dto";
import type { Order } from "@domain/entities/order.entity";

export const GetRestaurantOrderDetailsMapper= {
    toDTO(order:Order):GetRestaurantOrderDetailsResponseDTO {
        return {
            orderId:order.id,
            orderNumber:order.orderNumber,
            orderStatus:order.orderStatus,
            orderType:order.orderType,
            paymentMode:order.paymentMode,
            paymentStatus:order.paymentStatus,

            customer: {
                userId: order.userId,
                name: order.userName,
                phone: order.userPhone,
            },

            tableNumber: order.tableNumber,
            estimatedReadyAt: order.estimatedReadyAt,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,

            items: order.items.map((item) => ({
                itemId: item.id,
                menuItemId: item.menuItemId,
                itemName: item.itemName,
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

            statusHistory: order.statusHistory.map((history) => ({
                previousStatus: history.previousStatus,
                currentStatus: history.currentStatus,
                changedBy: history.changedBy,
                notes: history.notes,
                createdAt: history.createdAt,
            })),

            pricing: {
                subtotal: order.subtotal,
                taxAmount: order.taxAmount,
                discountAmount: order.discountAmount,
                couponCode: order.couponCode,
                platformFee: order.platformFee,
                grandTotal: order.grandTotal,
            },

            specialInstructions: order.specialInstructions,
            cancellationReason: order.cancellationReason,
            cancelledAt: order.cancelledAt,
        }
    }
}