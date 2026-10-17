import type { IBaseRepository } from "@domain/repositories/base.repository.interface.ts";
import { injectable } from "inversify";

export interface IEntityMapper<TDomain, TModel> {
	toDomain(raw: TModel): TDomain;
	toPersistence?(entity: TDomain): Record<string, unknown>;
}

@injectable()
export abstract class PrismaBaseRepository<
	TDomain extends { id: string },
	TModel,
	TDelegate,
	TCreateInput = unknown,
	TUpdateInput = Record<string, unknown>,
> implements IBaseRepository<TDomain, TCreateInput, TUpdateInput>
{
	constructor(
		protected readonly dbModel: TDelegate,
		protected readonly mapper?: IEntityMapper<TDomain, TModel>,
	) {}

	// biome-ignore lint/suspicious/noExplicitAny: generic bridge for Prisma delegate
	protected get delegate(): any {
		return this.dbModel;
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

	protected handlePrismaError(_error: unknown, _context?: unknown): void {}
}

export default PrismaBaseRepository;
