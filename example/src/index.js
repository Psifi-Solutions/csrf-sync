import { csrfSync } from "csrf-sync";
import express from "express";
import session from "express-session";

const app = express();
const port = 5555;

app.use(
  session({
    secret: "test",
  })
);

const { generateToken, csrfSynchronisedProtection } = csrfSync();

app.get("/csrf-token", (req, res) => {
  return res.send(generateToken(req));
});

app.get("/hello", (req, res) => {
  return res.send("Hello World!");
});

app.use(csrfSynchronisedProtection);

app.get("/csrf-token-test", (req, res) => {
  return res.send("Test endpoint...");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
