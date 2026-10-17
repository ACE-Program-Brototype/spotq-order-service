import type { OrderOverviewItemData } from "@domain/repositories/order.repository.interface.ts";

export interface PrismaOrderOverviewRecord {
	id: string;
	orderNumber: string;
	orderStatus: string;
	userId: string | null;
	grandTotal: unknown;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export const OrderPersistenceMapper = {
	toOverviewItem(record: PrismaOrderOverviewRecord): OrderOverviewItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			orderStatus: record.orderStatus,
			userId: record.userId,
			grandTotal: Number(record.grandTotal),
			itemsCount: record._count.items,
			createdAt: record.createdAt,
		};
	},

	toOverviewItemList(
		records: PrismaOrderOverviewRecord[],
	): OrderOverviewItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toOverviewItem(record),
		);
	},
};

export default OrderPersistenceMapper;
