# Frequently Asked Questions

The advice provided here is not exhaustive, `csrf-sync` does not take any liability for your security choices (or lack thereof). It is your responsibility to ensure you have an accurate threat model of your application(s)/service(s) and are handling it appropriately.


## Questions

* [What is a CSRF attack?](#what-is-a-csrf-attack)
  * [Additional Resources](#additional-resources)
* [Do I need CSRF protection?](#do-i-need-csrf-protection)
* [Do I need csrf-sync?](#do-i-need-csrf-csrf)
* [Do I need to protect unauthorised routes (e.g. login)?](#do-i-need-to-protect-unauthorised-routes-eg-login)
* [How should the CSRF token be transmitted?](#how-should-the-csrf-token-be-transmitted)
  * [Backend to frontend](#backend-to-frontend)
  * [Frontend to backend](#frontend-to-backend)
* [How to secret?](#how-to-secret)
* [Dealing with 'ForbiddenError: invalid csrf token'](#dealing-with-forbiddenerror-invalid-csrf-token)

---
### What is a CSRF attack?

When a cookie is used for authentication/authorisation, any request a browser makes to the domain the cookie is set on, **traditionally** the cookie is included in the request by default, regardless of where the request comes from. The intention of a CSRF attack is to trick a users browser into making a request with some side effect, the request will automatically be considered authorised.

The purpose of CSRF protection is to help determine whether a request was legitimately intended and made by the authorised user, thus rejecting requests made by such malicious means.

#### Additional Resources

* [OWASP Session Managedment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
* [OWASP CSRF Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
* [CSRF Protection Course by PortSwigger](https://portswigger.net/web-security/csrf#what-is-csrf)
* [What is considered a cross-site request?](https://web.dev/articles/same-site-same-origin)


---
### Do I need CSRF protection?

If you are using a cookie for your authentication/authorisation then you may require CSRF protection. Note that, auth related cookies should be `httpOnly`, if you are using a JWT via a cookie, it should be `httpOnly`, and in this case, even though you are not using sessions, you may still need CSRF protection.

If you can guarantee all of the following things, then you can skip CSRF protection:

* You only support modern/evergreen browsers
* You do not use traditional form submits
  * Traditional form submits do not trigger CORs preflight checks and can be submitted cross-origin by default, they should have CSRF protection
* Your auth related cookies have the `sameSite` attribute set to `strict` or `lax`
* You have tight and explicit CORs configuration  
  * This means your allowed origins are explicitly configured in your CORs configuration and your backend will only accept incoming cookies from the domains you have specified 

If you answered no to any of the above points you likely need CSRF protection, or if you are unsure it could be best to have CSRF protection just in case, the overhead is negligible.


---
### Do I need csrf-sync?

If you answered yes to ["Do I need CSRF protection?](#do-i-need-csrf-protection) and you have server side state associated with requests then `csrf-sync` is the best and easiest option.

If you are using a JWT as a `httpOnly` cookie stateless sessions, or some other kind of `httpOnly` stateless authentication/authorisation, then you will need to use [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) for the Double-Submit cookie pattern instead.


---
### Do I need to protect unauthorised routes (e.g. login)?

If you are using session based authentication this usually means you generate a session for all of your users, regardless of whether they have logged in or not. Since you have anonymous sessions, the session already exists before they have logged in. In this case the login route, forgot password route, and any other such routes should be protected.

If you do not have anonymous sessions and are not tracking sessions until users are authenticated, then you may not need to protect your unauthorised routes.

If you are using OAuth2 to identify your users, do ensure the `state` parameter is used appropriately. If you are using OAuth2 with an SPA and no backend then you must use the PKCE flow, if you are using OAuth2 with an SPA that has a backend, prioritise using the Authorisation Code Grant flow.


---
### How should the CSRF token be transmitted?

#### Backend to frontend

The primary choice for sending the CSRF token to the frontend should be inside a response payload. Either in a JSON response or in a server side rendered HTML response. Whilst it is often common practice to set the CSRF token as a cookie so the frontend can access it that way, there are some cases where this is not recommended. It was a traditional approach for traditional backends and clients, if your backend and frontend are considered cross-site, then a cookie may not work.

[This article from Otka](https://developer.okta.com/blog/2022/07/08/spa-web-security-csrf-xss#validate-requests-for-authenticity-to-mitigate-csrf) recommends CSRF tokens be retrieved by an explicit endpoint when it comes to Single Page Applications (SPAs), but this recommendation really applies to any frontend that is considered cross site from the API serving it.

#### Frontend to backend

The primary choice for sending the CSRF token to the backend should be inside a custom header, such as the default `x-csrf-token`. The only alternative is to include the token in the request body, it was common in the past to include CSRF tokens as query parameters in the URL, however this is not considered secure.

If you are supporting cases where the CSRF token may be in either the header or the body, ensure your `getTokenFromRequest` is explicit. For example:

```js
(req) => {
    if (req.is('application/x-www-form-urlencoded')) {
        // where _csrf is the name of a hidden field on the form
        // or is processed as such via the FormData
        return req.body._csrf;
    }

    return req.headers['x-csrf-token'];
}
```

You need to be careful with `getTokenFromRequest` because it is this part of the protection that `csurf` got wrong and was deprecated for. The `getTokenFromRequest` should **never** return the token from a cookie, that is the same as not having any CSRF protection at all.


---
## How to secret?

Refer to the [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) for creation, storage, and processing of secrets. Also refer to the [secret reccomendations from `fastify/csrf-protection`](https://github.com/fastify/csrf-protection#securing-the-secret).

Keep in mind that you should not use `dotenv` in production unless you have explicitly followed their production recommendations to use `dotenvx`. It should otherwise only be used for development purposes and should only be required on the command line via the dev related commands.

Environment variables should typically be actual user scoped environment variables on the host system. You should generally have a user for the sole purpose of running your application where that user only has explicit bare minimum permissions required for running the application. Sensitive environment configuration should be handled via a secrets manager/store/vault.


---
## Dealing with 'ForbiddenError: invalid csrf token'

When using `csrf-sync` one of the most common reasons for this error is that the session cookie is not correctly configured. Here is what can happen to cause this error:

1. A new request is received
2. A new session is generated for the request
3. A CSRF token is generated for the request
4. The browser rejects the session cookie
5. The user sends another request but still does not have a session
6. A new session is generated for the request
7. The new session does not have a token, a new one might be generated, that will not match from step 3

One of the primary causes is `express-session` and the `secure` option. Whilst modern browsers will consider `localhost` to be `secure`, `express-session` - at the time of writing - has its own internal check to determine whether the `secure` flag is true, and will check if the request is actually secure. For `express-session` you will need to conditionally set the `secure` flag based on the environment, see issue ["Secure Flag cannot be set for unproxied localhost"](https://github.com/expressjs/session/issues/837).