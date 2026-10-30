import type { IBaseRepository } from "@domain/repositories/base.repository.interface.ts";
import { injectable } from "inversify";

export interface IEntityMapper<TDomain, TModel> {
	toDomain(raw: TModel): TDomain;
	toPersistence?(entity: TDomain): Record<string, unknown>;
}

export interface PrismaErrorLike {
	code?: string;
	meta?: { target?: string[] | string };
	message?: string;
}

@injectable()
export abstract class PrismaBaseRepository<
	TDomain = unknown,
	TModel = unknown,
	TDelegate = unknown,
	TCreateInput = unknown,
	TUpdateInput = Record<string, unknown>,
> implements IBaseRepository<TDomain, TCreateInput, TUpdateInput>
{
	constructor(
		protected readonly dbModel?: TDelegate,
		protected readonly mapper?: IEntityMapper<TDomain, TModel>,
	) {}

	// biome-ignore lint/suspicious/noExplicitAny: generic bridge for Prisma delegate
	protected get delegate(): any {
		return this.dbModel;
	}

	public async find(filter: Record<string, unknown> = {}): Promise<TDomain[]> {
		try {
			if (!this.delegate?.findMany) {
				return [];
			}
			const records = (await this.delegate.findMany({
				where: filter,
			})) as TModel[];
			return records.map((record) =>
				this.mapper
					? this.mapper.toDomain(record)
					: (record as unknown as TDomain),
			);
		} catch (error) {
			this.handlePrismaError(error, filter);
			throw error;
		}
	}

	public async findById(id: string): Promise<TDomain | null> {
		try {
			if (!this.delegate?.findUnique) {
				return null;
			}
			const record = (await this.delegate.findUnique({
				where: { id },
			})) as TModel | null;
			if (!record) {
				return null;
			}
			return this.mapper
				? this.mapper.toDomain(record)
				: (record as unknown as TDomain);
		} catch (error) {
			this.handlePrismaError(error, id);
			throw error;
		}
	}

	public async create(data: TCreateInput): Promise<TDomain> {
		try {
			if (!this.delegate?.create) {
				throw new Error("Delegate does not support create operation");
			}
			const record = (await this.delegate.create({
				data: data as Record<string, unknown>,
			})) as TModel;
			return this.mapper
				? this.mapper.toDomain(record)
				: (record as unknown as TDomain);
		} catch (error) {
			this.handlePrismaError(error, data);
			throw error;
		}
	}

	public async exists(id: string): Promise<boolean> {
		try {
			if (!this.delegate?.count) {
				return false;
			}
			const count = (await this.delegate.count({ where: { id } })) as number;
			return count > 0;
		} catch (error) {
			this.handlePrismaError(error, id);
			throw error;
		}
	}

	public async update(id: string, data: TUpdateInput): Promise<TDomain | null> {
		try {
			if (!this.delegate?.update) {
				return null;
			}
			const record = (await this.delegate.update({
				where: { id },
				data: data as Record<string, unknown>,
			})) as TModel;
			return this.mapper
				? this.mapper.toDomain(record)
				: (record as unknown as TDomain);
		} catch (error) {
			this.handlePrismaError(error, id);
			throw error;
		}
	}

	public async delete(id: string): Promise<boolean> {
		try {
			if (!this.delegate?.delete) {
				return false;
			}
			await this.delegate.delete({ where: { id } });
			return true;
		} catch (error) {
			this.handlePrismaError(error, id);
			throw error;
		}
	}

	protected handlePrismaError(error: unknown, context?: unknown): void {
		const prismaError = error as PrismaErrorLike;
		const code = prismaError?.code;

		if (code === "P2002") {
			const target = prismaError?.meta?.target;
			const targetStr = Array.isArray(target)
				? target.join(", ")
				: String(target || "resource");
			throw new Error(`Unique constraint violation on ${targetStr}`);
		}

		if (code === "P2025") {
			throw new Error(
				`Record not found in database for context: ${JSON.stringify(context ?? "unknown")}`,
			);
		}

		if (code === "P2003") {
			throw new Error("Foreign key constraint failed in database operation");
		}
	}
}
