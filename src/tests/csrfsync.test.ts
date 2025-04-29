import { type CsrfRequestToken, csrfSync } from "../index.js";
import csrfSyncTestSuite from "./suite/csrfsync";

csrfSyncTestSuite("csrfSync default config", csrfSync(), (req, tokenValue) => {
  req.headers["x-csrf-token"] = tokenValue;
});

csrfSyncTestSuite(
  "csrfSync with body based token and custom error",
  csrfSync({
    getTokenFromRequest: (req) => req.body.csrfToken as CsrfRequestToken,
    errorConfig: {
      statusCode: 400,
      message: "bad token",
      code: "BAD",
    },
  }),
  (req, tokenValue) => {
    req.body.csrfToken = tokenValue;
  },
);
