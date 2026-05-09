/**
 * parseApiError tests (§ 3.8).
 *
 * Goal: prove the contract — only allowlisted backend `detail` strings
 * pass through verbatim; everything else collapses to a curated
 * fallback. Per-field validation errors are exposed via fieldErrors.
 */
import { describe, it, expect } from "vitest";
import { parseApiError } from "@/lib/api/errors";

function axios(status: number, data: unknown = {}) {
    return { response: { status, data } };
}

describe("parseApiError — network", () => {
    it("classifies axios ERR_NETWORK as network_error", () => {
        const err = parseApiError({ code: "ERR_NETWORK" });
        expect(err.code).toBe("network_error");
        expect(err.message).toMatch(/couldn't reach the server/i);
    });

    it("classifies ECONNABORTED as network_error", () => {
        const err = parseApiError({ code: "ECONNABORTED" });
        expect(err.code).toBe("network_error");
    });

    it("classifies a non-axios value as unknown", () => {
        expect(parseApiError(undefined).code).toBe("unknown");
        expect(parseApiError(null).code).toBe("unknown");
        expect(parseApiError("string error").code).toBe("unknown");
    });
});

describe("parseApiError — status mapping", () => {
    it("429 → rate_limited", () => {
        expect(parseApiError(axios(429)).code).toBe("rate_limited");
    });
    it("403 → permission_denied", () => {
        expect(parseApiError(axios(403)).code).toBe("permission_denied");
    });
    it("404 → not_found", () => {
        expect(parseApiError(axios(404)).code).toBe("not_found");
    });
    it("500 → server_error", () => {
        expect(parseApiError(axios(500)).code).toBe("server_error");
    });
    it("502 → server_error (anything ≥500)", () => {
        expect(parseApiError(axios(502)).code).toBe("server_error");
    });
});

describe("parseApiError — safe-detail allowlist", () => {
    it("passes through Invalid email or password verbatim", () => {
        const err = parseApiError(
            axios(400, { non_field_errors: ["Invalid email or password."] }),
        );
        expect(err.code).toBe("invalid_credentials");
        expect(err.message).toBe("Invalid email or password.");
    });

    it("recognises the reset-link expired/invalid message", () => {
        const err = parseApiError(
            axios(400, { detail: "This reset link is invalid or has expired." }),
        );
        expect(err.code).toBe("invalid_token");
        expect(err.message).toMatch(/reset link.*expired/i);
    });

    it("recognises the verification-link expired/invalid message", () => {
        const err = parseApiError(
            axios(400, {
                detail: "This verification link is invalid or has expired.",
            }),
        );
        expect(err.code).toBe("invalid_token");
        expect(err.message).toMatch(/verification link.*expired/i);
    });

    it("recognises the reset-link already-used message", () => {
        const err = parseApiError(
            axios(400, { detail: "This reset link has already been used." }),
        );
        expect(err.code).toBe("token_already_used");
    });

    it("does NOT pass through arbitrary backend detail strings", () => {
        const err = parseApiError(
            axios(400, { detail: "DEBUG: user not found in db_users_v2" }),
        );
        expect(err.code).toBe("unknown");
        expect(err.message).not.toMatch(/db_users_v2/);
        expect(err.message).toMatch(/something went wrong/i);
    });
});

describe("parseApiError — field validation", () => {
    it("collects per-field validation errors", () => {
        const err = parseApiError(
            axios(400, {
                email: ["Enter a valid email address"],
                password: ["This field may not be blank."],
            }),
        );
        expect(err.code).toBe("validation_failed");
        expect(err.fieldErrors?.email).toEqual(["Enter a valid email address"]);
        expect(err.fieldErrors?.password).toEqual(["This field may not be blank."]);
        expect(err.message).toMatch(/correct the highlighted fields/i);
    });

    it("ignores non-array non-string-array values when collecting field errors", () => {
        const err = parseApiError(
            axios(400, {
                email: ["bad"],
                metadata: { nested: "ignored" },
            }),
        );
        expect(err.fieldErrors).toEqual({ email: ["bad"] });
    });
});

describe("parseApiError — 409 conflict", () => {
    it("returns conflict code with generic message when detail is not safe", () => {
        const err = parseApiError(
            axios(409, { detail: "internal-conflict-marker" }),
        );
        expect(err.code).toBe("conflict");
        expect(err.message).not.toContain("internal-conflict-marker");
    });

    it("returns the curated message for the trial-cancellation conflict", () => {
        const err = parseApiError(
            axios(409, { detail: "Trial is already cancelled." }),
        );
        expect(err.code).toBe("conflict");
        expect(err.message).toMatch(/trial can no longer be cancelled/i);
    });
});
