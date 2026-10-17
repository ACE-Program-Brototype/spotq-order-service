export abstract class DomainError extends Error {
	public readonly errorCode: string;
	public readonly code: string;

	constructor(message: string, errorCode: string) {
		super(message);
		this.name = this.constructor.name;
		this.errorCode = errorCode;
		this.code = errorCode;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default DomainError;
