import { csrfSync } from "csrf-sync";

export const { csrfSynchronisedProtection, invalidCsrfTokenError, generateToken } = csrfSync();
