import type { NextFunction, Request, Response } from "express";
import { randomBytes } from "node:crypto";
import createHttpError, { type HttpError } from "http-errors";

declare module "express-session" {
  export interface SessionData {
    csrfToken?: CsrfSyncedToken;
  }
}

export type CsrfSyncedToken = string | null | undefined;
export type CsrfTokenStorer = (req: Request, token?: CsrfSyncedToken) => void;
export type CsrfTokenRetriever = (req: Request) => CsrfSyncedToken;
export type CsrfTokenGenerator = (req: Request) => string;
export type CsrfTokenRevoker = (req: Request) => void;
export type CsrfRequestValidator = (req: Request) => boolean;
export type CsrfSynchronisedProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export interface CsrfSyncOptions {
  getTokenFromState?: CsrfTokenRetriever;
  storeTokenInState?: CsrfTokenStorer;
  header?: string;
  size?: number;
}

export interface CsrfSync {
  invalidCsrfTokenError: HttpError;
  csrfSynchronisedProtection: CsrfSynchronisedProtection;
  generateToken: CsrfTokenGenerator;
  getTokenFromState: CsrfTokenRetriever;
  isRequestValid: CsrfRequestValidator;
  storeTokenInState: CsrfTokenStorer;
  revokeToken: CsrfTokenRevoker;
}

export const csrfSync = ({
  getTokenFromState = (req) => {
    return req.session.csrfToken;
  },
  storeTokenInState = (req, token) => {
    req.session.csrfToken = token;
  },
  header = "x-csrf-token",
  size = 128,
}: CsrfSyncOptions = {}): CsrfSync => {
  const invalidCsrfTokenError = createHttpError(403, "invalid csrf token", {
    code: "EBADCSRFTOKEN",
  });

  const generateToken: CsrfTokenGenerator = (req) => {
    const newToken = randomBytes(size).toString("hex");
    storeTokenInState(req, newToken);

    return newToken;
  };

  const revokeToken: CsrfTokenRevoker = (req) => {
    storeTokenInState(req);
  };

  const isRequestValid: CsrfRequestValidator = (req) => {
    const receivedToken = req.headers[header];
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
    next
  ) => {
    const isCsrfValid = isRequestValid(req);
    if (!isCsrfValid) {
      return next(invalidCsrfTokenError);
    }

    revokeToken(req);

    next();
  };

  return {
    invalidCsrfTokenError,
    csrfSynchronisedProtection,
    generateToken,
    getTokenFromState,
    isRequestValid,
    storeTokenInState,
    revokeToken,
  };
};
