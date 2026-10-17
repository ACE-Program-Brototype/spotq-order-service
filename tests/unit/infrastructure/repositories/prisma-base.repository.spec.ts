import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	type IEntityMapper,
	PrismaBaseRepository,
} from "@infrastructure/repositories/prisma-base.repository.ts";

interface TestEntity {
	id: string;
	name: string;
}

interface TestModel {
	id: string;
	name: string;
}

const testMapper: IEntityMapper<TestEntity, TestModel> = {
	toDomain: (model) => ({ id: model.id, name: model.name }),
};

interface MockDelegate {
	findMany?: (args?: unknown) => Promise<TestModel[]>;
	findUnique?: (args: { where: { id: string } }) => Promise<TestModel | null>;
	create?: (args: { data: Record<string, unknown> }) => Promise<TestModel>;
	update?: (args: {
		where: { id: string };
		data: Record<string, unknown>;
	}) => Promise<TestModel>;
	delete?: (args: { where: { id: string } }) => Promise<TestModel>;
	count?: (args: { where: { id: string } }) => Promise<number>;
}

class ConcreteTestRepository extends PrismaBaseRepository<
	TestEntity,
	TestModel,
	MockDelegate,
	Record<string, unknown>,
	Record<string, unknown>
> {
	constructor(mockDelegate: MockDelegate) {
		super(mockDelegate, testMapper);
	}

	public triggerErrorHandler(error: unknown, context?: unknown): void {
		this.handlePrismaError(error, context);
	}
}

describe("PrismaBaseRepository", () => {
	it("should find records and map them to domain", async () => {
		const mockDelegate = {
			findMany: async () => [{ id: "1", name: "Alpha" }],
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		const results = await repo.find();
		assert.equal(results.length, 1);
		assert.equal(results[0].name, "Alpha");
	});

	it("should findById and map record", async () => {
		const mockDelegate = {
			findUnique: async ({ where }: { where: { id: string } }) =>
				where.id === "1" ? { id: "1", name: "Alpha" } : null,
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		const found = await repo.findById("1");
		assert.ok(found);
		assert.equal(found.id, "1");

		const missing = await repo.findById("non-existent");
		assert.equal(missing, null);
	});

	it("should create new record and map to domain", async () => {
		const mockDelegate = {
			create: async ({ data }: { data: Record<string, unknown> }) => ({
				id: "new-1",
				name: data.name as string,
			}),
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		const created = await repo.create({ name: "Beta" });
		assert.equal(created.id, "new-1");
		assert.equal(created.name, "Beta");
	});

	it("should update record and return domain entity", async () => {
		const mockDelegate = {
			update: async ({
				where,
				data,
			}: {
				where: { id: string };
				data: Record<string, unknown>;
			}) => ({
				id: where.id,
				name: data.name as string,
			}),
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		const updated = await repo.update("1", { name: "Updated" });
		assert.ok(updated);
		assert.equal(updated.name, "Updated");
	});

	it("should delete record and return true", async () => {
		const mockDelegate = {
			delete: async () => ({ id: "1" }),
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		const deleted = await repo.delete("1");
		assert.equal(deleted, true);
	});

	it("should check existence of record", async () => {
		const mockDelegate = {
			count: async () => 1,
		};
		const repo = new ConcreteTestRepository(mockDelegate);
		assert.equal(await repo.exists("1"), true);
	});

	it("should handle P2002 unique constraint violation in handlePrismaError", () => {
		const repo = new ConcreteTestRepository({});
		const error = { code: "P2002", meta: { target: ["email"] } };
		assert.throws(
			() => repo.triggerErrorHandler(error),
			/Unique constraint violation on email/,
		);
	});

	it("should handle P2025 record not found in handlePrismaError", () => {
		const repo = new ConcreteTestRepository({});
		const error = { code: "P2025" };
		assert.throws(
			() => repo.triggerErrorHandler(error, "cart-1"),
			/Record not found in database/,
		);
	});

	it("should handle P2003 foreign key constraint in handlePrismaError", () => {
		const repo = new ConcreteTestRepository({});
		const error = { code: "P2003" };
		assert.throws(
			() => repo.triggerErrorHandler(error),
			/Foreign key constraint failed in database operation/,
		);
	});
});
