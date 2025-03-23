import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "crypto";
import createHttpError, { type HttpError } from "http-errors";

declare module "express-session" {
  export interface SessionData {
    csrfToken?: CsrfSyncedToken;
  }
}

declare module "express-serve-static-core" {
  export interface Request {
    csrfToken?: (overwrite?: boolean) => ReturnType<CsrfTokenGenerator>;
  }
}

export type RequestMethod =
  | "GET"
  | "HEAD"
  | "PATCH"
  | "PUT"
  | "POST"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

export type CsrfSyncedToken = string | null | undefined;
export type CsrfRequestToken = string | undefined;
export type CsrfTokenStorer = (req: Request, token?: CsrfSyncedToken) => void;
export type CsrfTokenRetriever = (req: Request) => CsrfSyncedToken;
export type CsrfTokenGenerator = (req: Request, overwrite?: boolean) => string;
export type CsrfTokenRevoker = (req: Request) => void;
export type CsrfRequestValidator = (req: Request) => boolean;
export type CsrfErrorConfig = {
  statusCode: number;
  message: string;
  code: string | undefined;
};
export type CsrfErrorConfigOptions = Partial<CsrfErrorConfig>;
export type CsrfSynchronisedProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export interface CsrfSyncOptions {
  ignoredMethods?: RequestMethod[];
  getTokenFromRequest?: CsrfTokenRetriever;
  getTokenFromState?: CsrfTokenRetriever;
  storeTokenInState?: CsrfTokenStorer;
  size?: number;
  errorConfig?: CsrfErrorConfigOptions;
}

export interface CsrfSync {
  invalidCsrfTokenError: HttpError;
  csrfSynchronisedProtection: CsrfSynchronisedProtection;
  generateToken: CsrfTokenGenerator;
  getTokenFromRequest: CsrfTokenRetriever;
  getTokenFromState: CsrfTokenRetriever;
  isRequestValid: CsrfRequestValidator;
  storeTokenInState: CsrfTokenStorer;
  revokeToken: CsrfTokenRevoker;
}

export const csrfSync = ({
  ignoredMethods = ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest = (req) =>
    req.headers["x-csrf-token"] as CsrfRequestToken,
  getTokenFromState = (req) => {
    return req.session.csrfToken;
  },
  storeTokenInState = (req, token) => {
    req.session.csrfToken = token;
  },
  size = 128,
  errorConfig: {
    statusCode = 403,
    message = "invalid csrf token",
    code = "EBADCSRFTOKEN",
  } = {},
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

    return (
      typeof receivedToken === "string" &&
      typeof storedToken === "string" &&
      receivedToken === storedToken
    );
  };

  const csrfSynchronisedProtection: CsrfSynchronisedProtection = (
    req,
    res,
    next,
  ) => {
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
