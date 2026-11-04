import { z } from "zod";

export const restaurantOrderDetailsParamSchema = z.object({
  restaurantId: z.string().uuid({
    error: "Invalid restaurant ID",
  }),
  orderId: z.string().uuid({
    error: "Invalid order ID",
  }),
});

export type RestaurantOrderDetailsParam = z.infer<
	typeof restaurantOrderDetailsParamSchema
>;
