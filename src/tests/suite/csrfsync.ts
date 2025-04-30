import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import type { CsrfRequestToken, CsrfSync } from "../../types";
import { generateMocks, next } from "../utils/mock";

export type OverwriteMockRequestToken = (req: Request, tokenValue: CsrfRequestToken) => void;

export default (
  testSuiteName: string,
  {
    invalidCsrfTokenError,
    csrfSynchronisedProtection,
    generateToken,
    getTokenFromRequest,
    getTokenFromState,
    storeTokenInState,
    revokeToken,
  }: CsrfSync,
  overwriteMockRequestToken: OverwriteMockRequestToken,
) => {
  describe(testSuiteName, () => {
    const TEST_TOKEN = "test token";

    describe("storeTokenInState", () => {
      it("should store the token in the state", () => {
        const { mockRequest } = generateMocks();
        storeTokenInState(mockRequest, TEST_TOKEN);

        expect(getTokenFromState(mockRequest)).toBe(TEST_TOKEN);
      });
    });

    describe("generateToken", () => {
      it("should generate a token and store it on the session", () => {
        const { mockRequest } = generateMocks();

        expect(mockRequest.session.csrfToken).toBeUndefined();
        generateToken(mockRequest);
        // This is confirming the 2 values are the same
        // So that getTokenFromState can be used reliably in the tests.
        expect(mockRequest.session.csrfToken).toBe(getTokenFromState(mockRequest));
      });
    });

    describe("middleware", () => {
      const assertThrowsInvalidCsrfError = (mockRequest: Request, mockResponse: Response) => {
        expect(() => csrfSynchronisedProtection(mockRequest, mockResponse, next)).toThrow(
          invalidCsrfTokenError.message,
        );
      };

      it("should call next with an error when no token set for protected method", () => {
        const { mockRequest, mockResponse } = generateMocks();

        expect(getTokenFromRequest(mockRequest)).toBeUndefined();
        expect(getTokenFromState(mockRequest)).toBeUndefined();

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when no token received for protected method", () => {
        const { mockRequest, mockResponse } = generateMocks();
        generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, undefined);

        expect(getTokenFromRequest(mockRequest)).toBeUndefined();
        expect(getTokenFromState(mockRequest)).not.toBeUndefined();

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when tokens do not match for protected method", () => {
        const { mockRequest, mockResponse } = generateMocks();
        generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, TEST_TOKEN);

        expect(getTokenFromRequest(mockRequest)).not.toBe(getTokenFromState(mockRequest));

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when token is revoked for protected method", () => {
        const { mockRequest, mockResponse } = generateMocks();
        const token = generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, token);

        expect(mockRequest.session.csrfToken).not.toBeUndefined();
        expect(getTokenFromRequest(mockRequest)).toBe(getTokenFromState(mockRequest));

        revokeToken(mockRequest);

        expect(getTokenFromState(mockRequest)).toBeUndefined();
        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should succeed when tokens match for protected method", () => {
        const { mockRequest, mockResponse } = generateMocks();
        const token = generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, token);

        expect(() => csrfSynchronisedProtection(mockRequest, mockResponse, next)).not.toThrow();
      });

      it("should succeed with no token for ignored method", () => {
        const { mockRequest, mockResponse } = generateMocks();
        mockRequest.method = "GET";
        expect(() => {
          csrfSynchronisedProtection(mockRequest, mockResponse, next);
        }).not.toThrow();
      });

      it("should generate a token if none exists and overwrite true", () => {
        const { mockRequest } = generateMocks();
        const initialToken = generateToken(mockRequest, true);

        expect(initialToken).not.toBeUndefined();
      });

      it("should not overwrite token by default", () => {
        const { mockRequest } = generateMocks();
        const initialToken = generateToken(mockRequest);
        const secondaryToken = generateToken(mockRequest);

        expect(initialToken).toBe(secondaryToken);
      });
    });

    it("should overwrite when overwrite true", () => {
      const { mockRequest } = generateMocks();
      const initialToken = generateToken(mockRequest);
      const secondaryToken = generateToken(mockRequest, true);

      expect(initialToken).not.toBe(secondaryToken);
    });

    it("should attach generateToken to request via csrfToken", () => {
      const { mockRequest, mockResponse } = generateMocks();
      mockRequest.method = "GET";

      expect(mockRequest.csrfToken).toBeUndefined();
      csrfSynchronisedProtection(mockRequest, mockResponse, next);
      expect(mockRequest.csrfToken).toBeTypeOf("function");
      const reqGeneratedToken = mockRequest.csrfToken!();

      expect(reqGeneratedToken).toBe(generateToken(mockRequest, false));
      overwriteMockRequestToken(mockRequest, reqGeneratedToken);
      mockRequest.method = "POST";

      expect(() => {
        csrfSynchronisedProtection(mockRequest, mockResponse, next);
      }).not.toThrow();
    });
  });
};
