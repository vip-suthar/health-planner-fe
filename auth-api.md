# Auth API — Frontend Integration

Identifier-first auth on AWS Cognito. One email decides everything; the sign-in
method is never a forced choice. Backend is Express/Lambda; all auth endpoints are
unauthenticated (no token) except where noted.

Base path: `/auth`. All requests/responses are JSON.

---

## Response envelope

Every endpoint returns this envelope.

**Success**
```json
{
  "success": true,
  "data": { /* endpoint-specific */ },
  "meta": { "timestamp": "2026-06-28T12:00:00.000Z", "requestId": "abc-123" }
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email or password is incorrect.",
    "details": { "nextStep": "start", "retryable": true }
  },
  "meta": { "timestamp": "…", "requestId": "abc-123" }
}
```

- `error.code` is **stable** — switch on it, not on the message.
- `error.message` is safe to display to users.
- `error.details.nextStep` (optional) names the screen/endpoint to route to next.
- `error.details.retryable` (optional) — whether retrying the same call may succeed.
- Validation errors use code `VALIDATION_ERROR` (HTTP 422) with `details` as an
  array of `{ message }`.

---

## Shared structures

**Tokens**
```ts
interface Tokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}
```

**User**
```ts
interface User {
  id: string;            // Cognito sub
  email: string;
  username: string;      // == email
  name?: string;
  gender?: string;
  birthday?: string;     // ISO date
}
```

**Challenge (sign-in in progress)** — returned when more steps are needed:
```ts
interface ChallengeState {
  hasNextStep: true;
  nextStep: "submit-otp" | "submit-password" | "select-challenge" | "respond-challenge";
  challengeName: "EMAIL_OTP" | "SELECT_CHALLENGE" | "PASSWORD" | string;
  session: string;                 // opaque; pass back unmodified to /auth/respond
  availableChallenges?: string[];  // e.g. ["PASSWORD","EMAIL_OTP","WEB_AUTHN"]
  codeDelivery?: { medium: "EMAIL"; destination: string }; // masked, e.g. a***@x.com
}
```

**Auth result (signed in)** — returned on success of `/respond`, `/social`:
```ts
interface AuthResult { user: User; tokens: Tokens; }
```

### Using tokens
For protected (non-`/auth`) endpoints send the **ID token**:
```
Authorization: Bearer <idToken>
```
Access token expires in 1h; refresh via `/auth/token/refresh`. Refresh tokens are
rotated — always store the `refreshToken` returned by the latest call.

---

## Endpoints

### `POST /auth/start` — identifier-first entry (UX G2 "Continue")
Auto-creates the account if the email is new, then emails a login code. The
response is identical whether or not the account already existed (no account-
existence leak).

Request: `{ "email": "a@b.com" }`
Response `200` → `ChallengeState` with `challengeName: "EMAIL_OTP"`,
`nextStep: "submit-otp"`, plus `availableChallenges` for the "more ways to sign
in" affordance and `codeDelivery`.

Next: submit the code via `/auth/respond`. To **resend**, call `/auth/start`
again (apply a client-side cooldown).

### `POST /auth/respond` — answer a challenge
Disambiguation is by the presence of `answer`.

Request:
```ts
{
  email: string;
  session: string;                 // from /start or /initiate
  challenge: "EMAIL_OTP" | "PASSWORD";
  answer?: string;                 // see table
}
```
| challenge | answer | effect |
|-----------|--------|--------|
| `EMAIL_OTP` | the 6-digit code | completes sign-in → `AuthResult` |
| `EMAIL_OTP` | _omitted_ | selects email factor → sends code, returns `EMAIL_OTP` `ChallengeState` |
| `PASSWORD` | the password | completes sign-in → `AuthResult` |

Response `200` → `AuthResult` (signed in) **or** `ChallengeState` (another step).

### `POST /auth/initiate` — start an alternate factor (UX G4/G5 "more ways")
Returns a `SELECT_CHALLENGE` session + `availableChallenges` **without** sending a
code. Use when the user picks password/passkey instead of the default email code.

Request: `{ "email": "a@b.com", "preferredFactor?": "EMAIL_OTP" }`
Response `200` → `ChallengeState`. Then call `/auth/respond` with the chosen factor.

Password sign-in (full): `POST /auth/initiate {email}` → `POST /auth/respond
{email, session, challenge:"PASSWORD", answer:<password>}` → `AuthResult`.

### `POST /auth/social` — Google / Apple one-tap (UX G2)
Verify a native-SDK provider token; links/creates the Cognito user.

Request: `{ "provider": "google" | "apple", "idToken": "<provider id_token>", "name?": "Jane" }`
Response `200` → `AuthResult` plus `isNewUser: boolean`.
(`name` is optional; Apple only returns it on first consent.)

### `POST /auth/token/refresh` — refresh tokens
Request: `{ "refreshToken": "<token>" }`
Response `200` → `{ tokens: Tokens }`. Store the (possibly rotated) `refreshToken`.

### `POST /auth/logout`
Request: `{ "refreshToken": "<token>" }`
Response `200` → `{ message }`. Idempotent. Revokes the refresh-token chain;
already-issued access tokens stay valid until they expire.

### `POST /auth/recover` — start password reset (UX G6)
Sends a **distinct** reset code (separate from the login code). Always returns
`202` regardless of whether the email exists (no enumeration).

Request: `{ "email": "a@b.com" }`
Response `202` → `{ message, nextStep: "recover/confirm" }`.

### `POST /auth/recover/confirm` — set new password (UX G7)
Request: `{ "email": "a@b.com", "code": "123456", "newPassword": "<password>" }`
Response `200` → `{ message }`. Then sign in via `/auth/start` or `/auth/initiate`.

Password policy: 8–256 chars, with lowercase, uppercase, number, and a symbol
(`! @ # $ % ^ & *`).

---

## Flows (happy path)

**Email code (default)** — G2→G3
```
/auth/start {email}                         → { session, challengeName:"EMAIL_OTP", … }
/auth/respond {email, session, "EMAIL_OTP", answer:code}  → { user, tokens }
```

**Password** — G2→G4
```
/auth/initiate {email}                      → { session, availableChallenges }
/auth/respond {email, session, "PASSWORD", answer:password} → { user, tokens }
```

**Social** — G2 one-tap
```
native SDK → provider idToken
/auth/social {provider, idToken}            → { user, tokens, isNewUser }
```

**Password reset** — G6→G7
```
/auth/recover {email}                       → 202
/auth/recover/confirm {email, code, newPassword} → 200, then sign in
```

**New vs returning user:** `/auth/start` does not say. After sign-in, read the
user's profile (e.g. `GET /data/user`); an incomplete profile ⇒ route to
onboarding.

---

## Error codes

| code | HTTP | meaning / typical UI |
|------|------|----------------------|
| `VALIDATION_ERROR` | 422 | bad/missing fields (`details` = array of messages) |
| `AUTH_INVALID_CREDENTIALS` | 401 | wrong password (generic; don't say which field) |
| `AUTH_OTP_INVALID` | 400 | wrong code — let user retry |
| `AUTH_OTP_EXPIRED` | 400 | code expired — `nextStep` to resend/restart |
| `AUTH_SESSION_EXPIRED` | 401 | `session`/refresh dead — restart sign-in |
| `AUTH_UNVERIFIED` | 403 | email not verified — `nextStep: "start"` |
| `AUTH_RESET_REQUIRED` | 403 | must reset — `nextStep: "recover"` |
| `AUTH_ACCOUNT_DISABLED` | 403 | contact support |
| `AUTH_RATE_LIMITED` | 429 | back off (`retryable: true`) |
| `AUTH_PASSWORD_POLICY` | 422 | password too weak |
| `AUTH_EMAIL_EXISTS` | 409 | account exists — `nextStep: "initiate"` |
| `AUTH_SOCIAL_TOKEN_INVALID` | 401 | bad/expired provider token |
| `AUTH_SOCIAL_EMAIL_UNVERIFIED` | 403 | provider email not verified |
| `AUTH_SOCIAL_NOT_CONFIGURED` | 500 | provider not enabled server-side |
| `AUTH_INTERNAL_ERROR` | 500 | generic; retryable |

---

## Notes
- **Codes are single-purpose:** the login code (`EMAIL_OTP`) and the reset code
  (`/recover`) are different and not interchangeable — keep their screens distinct.
- **Passkey (WebAuthn, UX G5):** not live yet. `WEB_AUTHN` may appear in
  `availableChallenges` once enrolment ships; treat it as "coming soon" until the
  passkey endpoints exist.
- **Edit email:** no API call — just send a new `/auth/start`.
