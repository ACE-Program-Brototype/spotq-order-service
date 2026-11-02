import {z} from "zod"

export const restaurantOrderDetailsParamSchema =z.object({
    restaurantId: z.string().uuid(),
    orderId: z.string().uuid(),
});

export type RestaurantOrderDetailsParam =z.infer<
    typeof restaurantOrderDetailsParamSchema
>