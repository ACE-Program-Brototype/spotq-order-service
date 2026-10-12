import { z } from "zod";

export const cartIdParamSchema = z.object({
	cartId: z.string().uuid({ message: "Invalid cart ID format" }),
});

export type CartIdParam = z.infer<typeof cartIdParamSchema>;

export default cartIdParamSchema;
