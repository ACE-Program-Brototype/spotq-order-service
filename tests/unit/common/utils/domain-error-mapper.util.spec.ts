import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { CART_ERROR_CODES } from "@common/constants/message.constants.ts";
import {
	DOMAIN_ERROR_HTTP_MAP,
	mapDomainErrorToHttpStatus,
} from "@common/utils/domain-error-mapper.util.ts";

describe("domain-error-mapper.util", () => {
	it("should map known domain error codes to corresponding HTTP status codes", () => {
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_NOT_FOUND),
			HTTP_STATUS.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_ITEM_NOT_FOUND),
			HTTP_STATUS.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.MENU_ITEM_NOT_FOUND),
			HTTP_STATUS.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_EXPIRED),
			HTTP_STATUS.GONE,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.FORBIDDEN_CART_ACCESS),
			HTTP_STATUS.FORBIDDEN,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART),
			HTTP_STATUS.CONFLICT,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.ITEM_UNAVAILABLE),
			HTTP_STATUS.CONFLICT,
		);
	});

	it("should default to 400 Bad Request for unknown error code", () => {
		assert.equal(
			mapDomainErrorToHttpStatus("UNKNOWN_ERROR_CODE"),
			HTTP_STATUS.BAD_REQUEST,
		);
	});

	it("should expose DOMAIN_ERROR_HTTP_MAP dictionary", () => {
		assert.ok(DOMAIN_ERROR_HTTP_MAP);
		assert.equal(
			DOMAIN_ERROR_HTTP_MAP[CART_ERROR_CODES.CART_NOT_FOUND],
			HTTP_STATUS.NOT_FOUND,
		);
	});
});
