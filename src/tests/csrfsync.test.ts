/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { CsrfRequestToken, csrfSync } from "../index.js";
import csrfSyncTestSuite from "./suite/csrfsync";

csrfSyncTestSuite(
  "csrfSync default config",
  csrfSync(),
  (req, tokenValue) => { req.headers['x-csrf-token'] = tokenValue });

csrfSyncTestSuite(
  "csrfSync with body based token", 
  csrfSync({
    getTokenFromRequest: req => req.body.csrfToken as CsrfRequestToken,
  }), 
  (req, tokenValue) => req.body.csrfToken = tokenValue);
