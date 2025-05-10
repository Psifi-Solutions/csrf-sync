import { randomBytes } from "node:crypto";
import type { Request } from "express";
import createHttpError from "http-errors";
import type {
  CsrfRequestToken,
  CsrfRequestValidator,
  CsrfSync,
  CsrfSyncOptions,
  CsrfSynchronisedProtection,
  CsrfTokenGenerator,
  CsrfTokenRevoker,
  RequestMethod,
} from "./types";

export * from "./types";

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
  skipCsrfProtection,
}: CsrfSyncOptions = {}): CsrfSync => {
  const ignoredMethodsSet = new Set(ignoredMethods);

  const requiresCsrfProtection = (req: Request) => {
    const shouldSkip = typeof skipCsrfProtection === "function" && skipCsrfProtection(req);
    // Explicitly check the return type is boolean so we don't accidentally skip protection for other truthy values
    return !(ignoredMethodsSet.has(req.method as RequestMethod) || (typeof shouldSkip === "boolean" && shouldSkip));
  };

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

    if (!requiresCsrfProtection(req)) {
      next();
    } else if (isRequestValid(req)) {
      next();
    } else {
      next(invalidCsrfTokenError);
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
