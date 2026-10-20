import { randomBytes } from "node:crypto";

export function generateOrderNumber(): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const randomPart = randomBytes(3).toString("hex").toUpperCase();
	return `ORD-${timestamp}-${randomPart}`;
}
