import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { CART_ERROR_CODES } from "@shared/constants/message.constants.ts";
import {
	DOMAIN_ERROR_HTTP_MAP,
	mapDomainErrorToHttpStatus,
} from "@shared/utils/domain-error-mapper.util.ts";

describe("domain-error-mapper.util", () => {
	it("should map known domain error codes to corresponding HTTP status codes", () => {
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_NOT_FOUND),
			HttpStatus.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_ITEM_NOT_FOUND),
			HttpStatus.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.MENU_ITEM_NOT_FOUND),
			HttpStatus.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_EXPIRED),
			HttpStatus.GONE,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.FORBIDDEN_CART_ACCESS),
			HttpStatus.FORBIDDEN,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART),
			HttpStatus.CONFLICT,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.ITEM_UNAVAILABLE),
			HttpStatus.CONFLICT,
		);
	});

	it("should default to 400 Bad Request for unknown error code", () => {
		assert.equal(
			mapDomainErrorToHttpStatus("UNKNOWN_ERROR_CODE"),
			HttpStatus.BAD_REQUEST,
		);
	});

	it("should expose DOMAIN_ERROR_HTTP_MAP dictionary", () => {
		assert.ok(DOMAIN_ERROR_HTTP_MAP);
		assert.equal(
			DOMAIN_ERROR_HTTP_MAP[CART_ERROR_CODES.CART_NOT_FOUND],
			HttpStatus.NOT_FOUND,
		);
	});
});
