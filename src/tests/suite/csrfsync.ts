import { assert, expect } from "chai";
import { Request, Response } from "express";
import { CsrfRequestToken, CsrfSync } from "../../index.js";

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
  overwriteMockRequestToken: OverwriteMockRequestToken) => {
  describe(testSuiteName, () => {
    const generateMocks = () => {
      const mockRequest = {
        session: {
          csrfToken: undefined,
        },
        headers: {},
        body: {},
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

    const TEST_TOKEN = "test token";

    describe("storeTokenInState", () => {
      it("should store the token in the state", () => {
        const { mockRequest } = generateMocks();
        storeTokenInState(mockRequest, TEST_TOKEN);

        assert.equal(getTokenFromState(mockRequest), TEST_TOKEN);
      });
    });

    describe("generateToken", () => {
      it("should generate a token and store it on the session", () => {
        const { mockRequest } = generateMocks();

        assert.equal(mockRequest.session.csrfToken, undefined);
        generateToken(mockRequest);
        // This is confirming the 2 values are the same
        // So that getTokenFromState can be used reliably in the tests.
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

        assert.isUndefined(getTokenFromRequest(mockRequest));
        assert.isUndefined(getTokenFromState(mockRequest));

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when no token received", () => {
        const { mockRequest, mockResponse } = generateMocks();
        generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, undefined);

        assert.isUndefined(getTokenFromRequest(mockRequest));
        expect(getTokenFromState(mockRequest)).to.not.be.undefined;

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when tokens do not match", () => {
        const { mockRequest, mockResponse } = generateMocks();
        generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, TEST_TOKEN);

        assert.notEqual(
          getTokenFromRequest(mockRequest),
          getTokenFromState(mockRequest)
        );

        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should call next with an error when token is revoked", () => {
        const { mockRequest, mockResponse } = generateMocks();
        const token = generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, token);

        expect(mockRequest.session.csrfToken).to.not.be.undefined;
        assert.equal(
          getTokenFromRequest(mockRequest),
          getTokenFromState(mockRequest)
        );

        revokeToken(mockRequest);

        assert.isUndefined(getTokenFromState(mockRequest));
        assertThrowsInvalidCsrfError(mockRequest, mockResponse);
      });

      it("should succeed when tokens match", () => {
        const { mockRequest, mockResponse } = generateMocks();
        const token = generateToken(mockRequest);
        overwriteMockRequestToken(mockRequest, token);

        expect(() =>
          csrfSynchronisedProtection(mockRequest, mockResponse, next)
        ).to.not.throw();
      });
    });
  });
}