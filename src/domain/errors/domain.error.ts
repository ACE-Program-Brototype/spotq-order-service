export abstract class DomainError extends Error {
	public readonly errorCode: string;
	public readonly code: string;

	constructor(message: string, errorCode?: string) {
		super(message);
		this.name = this.constructor.name;
		const code =
			errorCode ??
			(this as unknown as { errorCode?: string }).errorCode ??
			"DOMAIN_ERROR";
		this.errorCode = code;
		this.code = code;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default DomainError;
