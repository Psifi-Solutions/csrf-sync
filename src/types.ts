import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "http-errors";

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

export type RequestMethod = "GET" | "HEAD" | "PATCH" | "PUT" | "POST" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE";

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
export type CsrfSynchronisedProtection = (req: Request, res: Response, next: NextFunction) => void;

export interface CsrfSyncOptions {
  ignoredMethods?: RequestMethod[];
  getTokenFromRequest?: CsrfTokenRetriever;
  getTokenFromState?: CsrfTokenRetriever;
  storeTokenInState?: CsrfTokenStorer;
  size?: number;
  errorConfig?: CsrfErrorConfigOptions;
  skipCsrfProtection?: (req: Request) => boolean;
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
