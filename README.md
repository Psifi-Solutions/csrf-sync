<h1 align="center">
  CSRF Sync
</h1>

<h4 align="center">A utility package to help implement stateful CSRF protection using the Synchroniser Token Pattern in express.</h4>

<p align="center">
  <a href="nmpmlink">
    <img src="https://img.shields.io/npm/v/csrf-sync" />
  </a>
  <a href="https://discord.gg/JddkbuSnUU">
    <img src="https://discordapp.com/api/guilds/643569902866923550/widget.png?style=shield">
  </a>
  <a href="https://patreon.com/Psibean">
    <img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3DPsibean%26type%3Dpatrons&style=flat" />
  </a>
</p>

<p align="center">
  <a href="#dos-and-donts">Dos and Don'ts</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#support">Support</a>
</p>

<h2 id="background"> Background</h2>

<p>
  This module intends to provide the necessary pieces required to implement CSRF protection using the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern">Synchroniser Token Pattern</a>. This means you will require server side state, if you require stateless CSRF protection, please see <a href="some-url">csrf-csrf</a> for the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie">Double-Submit Cookie Pattern</a>.
</p>

<p>
  Since <a href="https://github.com/expressjs/csurf">csurf</a> has been deprecated I struggled to find alternative solutions that were accurately implemented and configurable, so I decided to write my own! A lot of CSRF protection based packages often try to provide a full solution, or they only provide the Double-Submit Cookie method, and in doing so, they become rather complicated to configure. So much so, that your configuration alone could render the protection completely useless.
</o>

<p>
  This is why csrf-sync aims to provide a single and targeted implementation to simplify it's use.
</p>

<h2 id="dos-and-donts">Dos and Don'ts</h2>
<ul>
  <li>
    Do read the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html">OWASP - Cross-Site Request Forgery Prevention Cheat Sheet</a>
  </li>
  <li>
    Do read the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html">OWASP - Session Management Cheat Sheet</a>
  </li>
  <li>
    Do join the Discord server and ask questions in the <code>psifi-support</code> channel if you need help.
  </li>
  <li>
    Do make sure you do not compromise your security by not following OWASP practices.
  </li>
  <li>
    <b>Do not</b> transmit your CSRF token by cookies.
  </li>
  <li>
    <b>Do not</b> include your CSRF tokens in any log output.
  </li>
    <li>
    <b>Do not</b> use the same unauthenticated session for a user after they have authenticated. Make sure you destroy the session and create a new one. If they logout, destroy the session and create a new one. Keep in mind any generated token will be lost once a session is destroyed.
  </li>
</ul>

<h2 id="getting-started">Getting Started</h2>
<p>
  This section will guide you through using the default setup, which does sufficiently implement the Synchronised Token Pattern. If you'd like to customise the configuration, see the <a href="#configuration">configuration</a> section.
</p>
<p>
  You will need to be using <a href="https://github.com/expressjs/session">express-session</a> (or a session middleware which provides a <code>request.session</code> property). this utility will add a <code>csrfToken</code> property to <code>request.session</code>.
</p>

```
npm install express express-session csrf-sync
```

```js
import { csrfSync } from "csrf-sync";

  const {
    invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
    generateToken, // Use this in your routes to generate, store, and get a CSRF token.
    getTokenFromState, // The default method for retrieving a token from state.
    storeTokenInState, // The default method for storing a token in state.
    revokeToken, // Revokes/deletes a token by calling storeTokenInState(undefined)
    csrfSynchronisedProtection // This is the default CSRF protection middleware.
  } = csrfSync();
```

<p>
  This will extract the default utilities, you can configure these and re-export them from your own module. <b>You should only transmit your token to the frontend as part of a response payload, do not include the token in response headers or in a cookie.</b>
</O.>
<p>
  This means you will need to create your own route(s) for generating and retrieving a token. For example, a JSON endpoint which you can call before making form submissions:
</p>

```js
const myRoute = (req, res) => res.json({ token: generateToken(req) });
const myProtectedRoute = (req, res) =>
  res.json({ unpopularOpinion: "Game of Thrones was amazing" });
```

You can also put the token into the context of a templated HTML response. Just make sure you register this route before registering the middleware so you don't block yourself from getting a token.

```js
// Make sure your session middleware is registered before these
express.use(session);
express.get("/csrf-token", myRoute);
express.use(csrfSynchronisedProtection);
// Anything registered after this will be considered "protected"
```

<p>
  In most cases, it's unlikely you want to protect everything, so you can protect your routes on a case-to-case basis:
</p>

```js
app.get("/secret-stuff", csrfSynchronisedProtection, myProtectedRoute);
```

Or you can conditionally wrap the middleware yourself, like so (basic example):

```js
const myCsrfProtectionMiddleware = () => {
  const ignoremethods = new Set(["GET", "HEAD", "OPTIONS"]);
  return (req, res, next) => {
    if (ignoreMethods.has(req.method)) {
      next();
    } else {
      csrfSynchronisedProtection(req, res, next);
    }
  };
};
express.use(myCsrfProtectionMiddleware());
```

<p>
And now this will only require a CSRF token to be present for requests that aren't <code>GET</code>, <code>HEAD</code>, or <code>OPTIONS</code>.
</p>

Once a route is protected, you will need to include the most recently generated token in the `x-csrf-token` request header, otherwise you'll receive a `403 - ForbiddenError: invalid csrf token`.

<h2 id="configuration">Configuration</h2>

When creating your csrfSync, you have a few options available for configuration, all of them are optional and have sensible defaults (shown below).

```js
const csrfSync = csrfSync({
  getTokenFromState = (req) => {
    return req.session.csrfToken;
  }, // Used to retrieve the token from state.
  storeTokenInState = (req, token) => {
    req.session.csrfToken = token;
  }, // Used to store the token in state.
  header = "x-csrf-token", // The header name where the token is on incoming requests.
  size = 128, // The size of the generated tokens in bits
}):
```

<h2 id="support"> Support</h2>

<ul>
  <li>
    Join the <a href="https://discord.gg/JddkbuSnUU">Discord</a> and ask for help in the <code>psifi-support</code> channel.
  </li>
  <li>
    Pledge your support through the <a href="">Patreon</a>
  </li>
</ul>
