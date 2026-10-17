export abstract class DomainError extends Error {
	public abstract readonly errorCode: string;

	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
