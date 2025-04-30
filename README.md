<h1 align="center">
  CSRF Sync
</h1>

<h4 align="center">A utility package to help implement stateful CSRF protection using the Synchroniser Token Pattern in express.</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/csrf-sync">
    <img src="https://img.shields.io/npm/v/csrf-sync" />
  </a>
  <a href='https://coveralls.io/github/Psifi-Solutions/csrf-sync?branch=main'><img src='https://coveralls.io/repos/github/Psifi-Solutions/csrf-sync/badge.svg?branch=main' alt='Coverage Status' /></a>
  <a href="https://discord.gg/JddkbuSnUU">
    <img src="https://discordapp.com/api/guilds/643569902866923550/widget.png?style=shield">
  </a>
    <a href="https://ko-fi.com/G2G813S7A0">
    <img width="150px" src="https://ko-fi.com/img/githubbutton_sm.svg" />
  </a>
</p>

<p align="center">
  <a href="#getting-started">Getting Started</a> •
  <a href="#configuration">Configuration</a> •
  <a href="./FAQ.md">FAQ</a> •
  <a href="#support">Support</a>
</p>

<h2 id="background">Background</h2>

<p>
  This module intends to provide the necessary pieces required to implement CSRF protection using the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern">Synchroniser Token Pattern</a>. This means you will require server side state, if you require stateless CSRF protection, please see <a href="https://github.com/Psifi-Solutions/csrf-csrf">csrf-csrf</a> for the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie">Double-Submit Cookie Pattern</a>.
</p>

<p>
  Since <a href="https://github.com/expressjs/csurf">csurf</a> has been deprecated I struggled to find alternative solutions that were accurately implemented and configurable, so I decided to write my own! A lot of CSRF protection based packages often try to provide a full solution, or they only provide the Double-Submit Cookie method, and in doing so, they become rather complicated to configure. So much so, that your configuration alone could render the protection completely useless.
</o>

<p>
  This is why <code>csrf-sync</code> aims to provide a single and targeted implementation to simplify it's use.
</p>

<h2 id="getting-started">Getting Started</h2>
<p>
  This section will guide you through using the default setup, which does sufficiently implement the Synchronised Token Pattern. Be sure to check the <a href="./FAQ.md">FAQ</a> as it can help you determine whether you need CSRF protection, and if  you do, whether <code>csrf-sync</code> is an appropriate choice, as well as provide insight on how to use it appropriately. If you would like to customise the configuration, see the <a href="#configuration">configuration</a> section, whenever you change a configuration, you should ensure you understand the impact of the change.
</p>
<p>
  You will need to be using <a href="https://github.com/expressjs/session">express-session</a> (or a session middleware which provides a <code>request.session</code> property). this utility will add a <code>csrfToken</code> property to <code>request.session</code>.
</p>

```
npm install express express-session csrf-sync
```

```js
// ESM
import { csrfSync } from "csrf-sync";
// CommonJS
const { csrfSync } = require("csrf-sync");
```

```js
const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to generate, store, and get a CSRF token.
  getTokenFromRequest, // use this to retrieve the token submitted by a user
  getTokenFromState, // The default method for retrieving a token from state.
  storeTokenInState, // The default method for storing a token in state.
  revokeToken, // Revokes/deletes a token by calling storeTokenInState(undefined)
  csrfSynchronisedProtection, // This is the default CSRF protection middleware.
} = csrfSync();
```

<p>
  This will extract the default utilities, you can configure these and re-export them from your own module. For handling the CSRF token see <a href="./FAQ.md#how-should-the-csrf-token-be-transmitted">"How should the CSRF token be transmitted?"</a> from the FAQ.
</p>
<p>
  You may need to create your own route(s) for generating and retrieving a token. For example, a JSON endpoint which you can call before making form submissions:
</p>

```js
const myRoute = (req, res) => res.json({ token: generateToken(req) });
const myProtectedRoute = (req, res) =>
  res.json({ unpopularOpinion: "Game of Thrones was amazing" });
```

You can also put the token into the context of a templated HTML response. Note in this case, the route is a <code>GET</code> request, and these request types are not protected (ignored request method), as they do not need to be protected so long as the route is not exposing any sensitive or sideeffect actions.

```js
// Make sure your session middleware is registered before these
express.use(session);
express.get("/csrf-token", myRoute);
express.use(csrfSynchronisedProtection);
// Anything registered after this will be considered "protected"
```

<p>
  You can also protect your routes on a case-to-case basis:
</p>

```js
app.get("/secret-stuff", csrfSynchronisedProtection, myProtectedRoute);
```

Once a route is protected, you will need to include the most recently generated token in the `x-csrf-token` request header, otherwise you'll receive a `403 - ForbiddenError: invalid csrf token`.

<h3>generateToken</h3>

<p>By default if a token already exists on the session object, <code>generateToken</code> <b>will not overwrite it</b>, it will simply return the existing token. If you wish to force a token generation, you can use the second parameter:<p>

```js
generateToken(req, true); // This will force a new token to be generated, even if one already exists
```

<p>Instead of importing and using <code>generateToken</code>, you can also use <code>req.csrfToken</code> any time after the <code>csrfSynchronisedProtection</code> middleware has executed on your incoming request.</p>

```js
req.csrfToken(); // same as generateToken(req) and generateToken(req, false);
req.csrfToken(true); // same as generateToken(req, true);
```

<h3>revokeToken</h3>

By default tokens <b>will NOT be revoked</b>, if you want or need to revoke a token you should use this method to do so. Note that if you call <code>generateToken</code> with <code>overwrite</code> set to true, this will revoke the any existing token and only the new one will be valid.

<h2 id="configuration">Configuration</h2>


<h3 id="configuration-error-config">errorConfig</h3>

```ts
statusCode?: number;
message?: string;
code?: string | undefined;
```

<p>
  <b>Optional<br />
  Default:</b>
</p>

```ts
{
  statusCode: 403,
  message: "invalid csrf token",
  code: "EBADCSRFTOKEN"
}
```

Used to customise the error response <code>statusCode</code>, the contained error <code>message</code>, and it's <code>code</code>, the error is constructed via <code>createHttpError</code>. The default values match that of <code>csurf</code> for convenience.


<h3 id="get-token-from-request">getTokenFromRequest</h3>

```ts
(req: Request) => string | null | undefined;
```

<p>
  <b>Optional<br />
  Default:</b>
</p>

```ts
(req: Request) => req.headers["x-csrf-token"];
```

<p>This function should return the token sent by the frontend, either in the request body/payload, or from the <code>x-csrf-token</code> header. <b>Do NOT</b> return the value from a cookie in this function, this would be the same as having no CSRF protection at all, see the <a href="./FAQ.md#how-should-the-csrf-token-be-transmitted">"How thould the csrf token be transmitted?"</a> section of the FAQ.<p>


<h3 id="get-token-from-state">getTokenFromState</h3>

```ts
(req: Request) => string | null | undefined;
```

<p>
  <b>Optional<br />
  Default:</b>
</p>

```ts
(req: Request) => req.session.csrfToken;
```

<p>This function should return the token from the backend state for the uniquely identified Request.</p>


<h3>size</h3>

```ts
number;
```

<p>
  <b>Optional<br />
  Default:</b> <code>128</code>
</p>

<p>The size in bytes of the generated CSRF tokens.</p>


<h3 id="skip-csrf-protection">skipCsrfProtection</h3>

```ts
(req: Request) => boolean;
```

<p><b>Optional - Use this option with extreme caution*</b></p>

<p>Used to determine whether CSRF protection should be skipped for the given request. If this callback is provided and the request is not in the <code>ignoredMethods</code>, then the callback will be called to determine whether or not CSRF token validation should be checked. If it returns <em>true</em> the CSRF protection will be skipped, if it returns <em>false</em> then CSRF protection will be checked.<p>

<p>* It is primarily provided to avoid the need of wrapping the <code>csrfSynchronisedProtection</code> middleware in your own middleware, allowing you to apply a global logic as to whether or not CSRF protection should be executed based on the incoming request. You should <b>only</b> skip CSRF protection for cases you are 100% certain it is safe to do so, for example, requests you have identified as coming from a native app. You should ensure you are not introducing any vulnerabilities that would allow your web based app to circumvent the protection via CSRF attacks. This option is <b>NOT</b> a solution for CSRF errors.</p>


<h3 id="store-token-in-state">storeTokenInState</h3>

```ts
(req: Request, token?: CsrfSyncedToken) => void;
```

<p>
  <b>Optional<br />
  Default:</b>
</p>

```ts
(req: Request, token: string) => {
  req.session.csrfToken = token;
}
```

<p>This function should store the token in the backend state for the uniquely identified Request.</p>


<h2>Processing as a header</h3>

When initialising <code>csrfSync</code>, you have a few options available for configuration, all of them are optional and have sensible defaults (shown below).

```js
const csrfSyncProtection = csrfSync({
  ignoredMethods = ["GET", "HEAD", "OPTIONS"],
  getTokenFromState = (req) => {
    return req.session.csrfToken;
  }, // Used to retrieve the token from state.
  getTokenFromRequest = (req) =>  {
    return req.headers['x-csrf-token'];
  }, // Used to retrieve the token submitted by the request from headers
  storeTokenInState = (req, token) => {
    req.session.csrfToken = token;
  }, // Used to store the token in state.
  size = 128, // The size of the generated tokens in bits
});

// NOTE THE VALUES ABOVE ARE THE DEFAULTS.
// THE ABOVE IS THE SAME AS DOING:

const csrfSyncProtection = csrfSync();
```

<h2>Processing as a form</h3>

If you intend to use this module to protect user submitted forms, then you can use `generateToken` to create a token and pass it to your view, likely via template variables. Then using a hidden form input such as the example from the <a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern">Cheat Sheet</a>.

```html
<form action="/transfer.do" method="post">
  <input
    type="hidden"
    name="CSRFToken"
    value="OWY4NmQwODE4ODRjN2Q2NTlhMmZlYWEwYzU1YWQwMTVhM2JmNGYxYjJiMGI4MjJjZDE1ZDZMGYwMGEwOA=="
  />
  [...]
</form>
```

Upon form submission a `csrfSync` configured as follows can be used to protect the form.

```js
const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => {
    return req.body["CSRFToken"];
  }, // Used to retrieve the token submitted by the user in a form
});
```

If using this with something like `express` you would need to provide/configure body parsing middleware before the CSRF protection.

If doing this per route, you would for example:

```js
app.post("/route/", csrfSynchronisedProtection, async (req, res) => {
  //process the form as we passed CSRF
});
```

<h3>Safely Using both body and header</h3>

```js
const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => {
    // If the incoming request is a application/x-www-form-urlencoded content type
    // then get the token from the body.
    if (req.is("application/x-www-form-urlencoded")) {
      return req.body["CSRFToken"];
    }
    // Otherwise use the header for all other request types
    return req.headers["x-csrf-token"];
  },
});
```

<h2>Using asynchronously</h2>

<p><code>csrf-sync</code> itself will not support promises or async, <b>however</b> there is a way around this. If your CSRF token is stored externally and needs to be retrieved asynchronously, you can register an asynchronous middleware first, which exposes the token.</p>

```js
(req, res, next) => {
  getCsrfTokenAsync(req)
    .then((token) => {
      req.asyncCsrfToken = token;
      next();
    })
    .catch((error) => next(error));
};
```

<p>And in this example, your `getTokenFromRequest` would look like this:</p>

```js
(req) => req.asyncCsrfToken;
```

<h2 id="support">Support</h2>

<ul>
  <li>
    Join the <a href="https://discord.gg/JddkbuSnUU">Discord</a> and ask for help in the <code>psifi-support</code> channel.
  </li>
  <li>
    Pledge your support through the <a href="">Patreon</a>
  </li>
</ul>

<a href="https://www.buymeacoffee.com/psibean" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
