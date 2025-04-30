import { describe, expect, it } from "vitest";
import { csrfSync } from "../index.js";
import { generateMocks, next } from "./utils/mock.js";

describe("csrf-csrf with skipCsrfProtection", () => {
  it("should skip CSRF protection when skipCsrfProtection returns true", () => {
    const { csrfSynchronisedProtection } = csrfSync({
      skipCsrfProtection: () => true,
    });

    const { mockResponse, mockRequest } = generateMocks();
    expect(mockRequest.csrfToken).toBeUndefined();
    expect(() => csrfSynchronisedProtection(mockRequest, mockResponse, next)).not.toThrow();
    expect(mockRequest.csrfToken).toBeTypeOf("function");
  });

  const testSkipCsrfProtectionFalsey = (skipCsrfProtection?: any) => {
    const { csrfSynchronisedProtection, generateToken } = csrfSync({
      skipCsrfProtection,
    });

    const { mockResponse, mockRequest } = generateMocks(); // with token needed
    mockRequest.headers["x-csrf-token"] = generateToken(mockRequest);

    expect(mockRequest.csrfToken).toBeUndefined();
    expect(() => csrfSynchronisedProtection(mockRequest, mockResponse, next)).not.toThrow();
    expect(mockRequest.csrfToken).toBeTypeOf("function");
  };

  it("should not skip CSRF protection when skipCsrfProtection returns false", () => {
    testSkipCsrfProtectionFalsey(() => false);
  });

  it("should not skip CSRF protection when skipCsrfProtection returns null", () => {
    testSkipCsrfProtectionFalsey(() => null);
  });

  it("should not skip CSRF protection when skipCsrfProtection returns undefined", () => {
    testSkipCsrfProtectionFalsey(() => undefined);
  });

  it("should not skip CSRF protection when skipCsrfProtection returns empty string", () => {
    testSkipCsrfProtectionFalsey(() => "");
  });

  it("should not skip CSRF protection when skipCsrfProtection returns empty object", () => {
    testSkipCsrfProtectionFalsey(() => ({}));
  });

  it("should not skip CSRF protection when skipCsrfProtection returns 1", () => {
    testSkipCsrfProtectionFalsey(() => 1);
  });

  it("should not skip CSRF protection when skipCsrfProtection is null", () => {
    testSkipCsrfProtectionFalsey(null);
  });

  it("should not skip CSRF protection when skipCsrfProtection is undefined", () => {
    testSkipCsrfProtectionFalsey(undefined);
  });
});
