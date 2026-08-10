enum SuccessStatus {
	OK = 200,
	CREATED = 201,
}

enum ErrorStatus {
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
}

const STATUS = {
	SUCCESS: SuccessStatus,
	ERROR: ErrorStatus,
};

export default STATUS;