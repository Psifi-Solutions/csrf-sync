import { randomBytes } from "node:crypto";
import createHttpError from "http-errors";
import type {
  CsrfRequestToken,
  CsrfRequestValidator,
  CsrfSync,
  CsrfSynchronisedProtection,
  CsrfSyncOptions,
  CsrfTokenGenerator,
  CsrfTokenRevoker,
  RequestMethod,
} from "./types";

export const csrfSync = ({
  ignoredMethods = ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest = (req) => req.headers["x-csrf-token"] as CsrfRequestToken,
  getTokenFromState = (req) => {
    return req.session.csrfToken;
  },
  storeTokenInState = (req, token) => {
    req.session.csrfToken = token;
  },
  size = 128,
  errorConfig: { statusCode = 403, message = "invalid csrf token", code = "EBADCSRFTOKEN" } = {},
}: CsrfSyncOptions = {}): CsrfSync => {
  const ignoredMethodsSet = new Set(ignoredMethods);

  const invalidCsrfTokenError = createHttpError(statusCode, message, {
    code,
  });

  const generateToken: CsrfTokenGenerator = (req, overwrite = false) => {
    if (!overwrite && typeof getTokenFromState(req) === "string") {
      return getTokenFromState(req) as string;
    }

    const newToken = randomBytes(size).toString("hex");
    storeTokenInState(req, newToken);

    return newToken;
  };

  const revokeToken: CsrfTokenRevoker = (req) => {
    storeTokenInState(req);
  };

  const isRequestValid: CsrfRequestValidator = (req) => {
    const receivedToken = getTokenFromRequest(req);
    const storedToken = getTokenFromState(req);

    return typeof receivedToken === "string" && typeof storedToken === "string" && receivedToken === storedToken;
  };

  const csrfSynchronisedProtection: CsrfSynchronisedProtection = (req, res, next) => {
    req.csrfToken = (overwrite) => generateToken(req, overwrite);

    if (ignoredMethodsSet.has(req.method as RequestMethod)) {
      next();
    } else {
      const isCsrfValid = isRequestValid(req);
      if (!isCsrfValid) {
        return next(invalidCsrfTokenError);
      }

      next();
    }
  };

  return {
    invalidCsrfTokenError,
    csrfSynchronisedProtection,
    generateToken,
    getTokenFromRequest,
    getTokenFromState,
    isRequestValid,
    storeTokenInState,
    revokeToken,
  };
};
