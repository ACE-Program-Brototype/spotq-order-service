import { injectable } from "inversify";

@injectable()
export abstract class PrismaBaseRepository {
	protected handleError(error: unknown): never {
		throw error;
	}
}

export default PrismaBaseRepository;
