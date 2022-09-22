/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { assert, expect } from "chai";
import { csrfSync } from "../index.js";
import { Request, Response } from "express";

describe("csrf-sync", () => {
  const {
    invalidCsrfTokenError,
    csrfSynchronisedProtection,
    generateToken,
    getTokenFromState,
    storeTokenInState,
    revokeToken,
  } = csrfSync();

  const generateMocks = () => {
    const mockRequest = {
      session: {
        csrfToken: undefined,
      },
      headers: {},
    } as unknown as Request;
    const mockResponse = {} as unknown as Response;
    return {
      mockRequest,
      mockResponse,
    };
  };

  const next = (err: any) => {
    if (err) throw err;
  };

  const HEADER_KEY = "x-csrf-token";
  const TEST_TOKEN = "test token";

  describe("storeTokenInState", () => {
    it("should store the token in the session", () => {
      const { mockRequest } = generateMocks();
      storeTokenInState(mockRequest, TEST_TOKEN);

      assert.equal(mockRequest.session.csrfToken, TEST_TOKEN);
    });
  });

  describe("generateToken", () => {
    it("should generate a token and store it on the session", () => {
      const { mockRequest } = generateMocks();

      assert.equal(mockRequest.session.csrfToken, undefined);
      generateToken(mockRequest);
      assert.equal(
        mockRequest.session.csrfToken,
        getTokenFromState(mockRequest)
      );
    });
  });

  describe("middleware", () => {
    const assertThrowsInvalidCsrfError = (
      mockRequest: Request,
      mockResponse: Response
    ) => {
      expect(() =>
        csrfSynchronisedProtection(mockRequest, mockResponse, next)
      ).to.throw(invalidCsrfTokenError.message);
    };

    it("should call next with an error when no token set", () => {
      const { mockRequest, mockResponse } = generateMocks();

      assert.isUndefined(mockRequest.headers[HEADER_KEY]);
      assert.isUndefined(mockRequest.session.csrfToken);

      assertThrowsInvalidCsrfError(mockRequest, mockResponse);
    });

    it("should call next with an error when no token received", () => {
      const { mockRequest, mockResponse } = generateMocks();
      generateToken(mockRequest);
      mockRequest.headers[HEADER_KEY] = undefined;

      assert.isUndefined(mockRequest.headers[HEADER_KEY]);
      expect(mockRequest.session.csrfToken).to.not.be.undefined;

      assertThrowsInvalidCsrfError(mockRequest, mockResponse);
    });

    it("should call next with an error when tokens do not match", () => {
      const { mockRequest, mockResponse } = generateMocks();
      generateToken(mockRequest);
      mockRequest.headers[HEADER_KEY] = TEST_TOKEN;

      assert.notEqual(
        mockRequest.headers[HEADER_KEY],
        mockRequest.session.csrfToken
      );

      assertThrowsInvalidCsrfError(mockRequest, mockResponse);
    });

    it("should call next with an error when token is revoked", () => {
      const { mockRequest, mockResponse } = generateMocks();
      const token = generateToken(mockRequest);
      mockRequest.headers[HEADER_KEY] = token;

      expect(mockRequest.session.csrfToken).to.not.be.undefined;
      assert.equal(
        mockRequest.headers[HEADER_KEY],
        mockRequest.session.csrfToken
      );

      revokeToken(mockRequest);

      assert.isUndefined(mockRequest.session.csrfToken);
      assertThrowsInvalidCsrfError(mockRequest, mockResponse);
    });

    it("should succeed when tokens match", () => {
      const { mockRequest, mockResponse } = generateMocks();
      const token = generateToken(mockRequest);
      mockRequest.headers[HEADER_KEY] = token;

      expect(() =>
        csrfSynchronisedProtection(mockRequest, mockResponse, next)
      ).to.not.throw();
    });
  });
});
