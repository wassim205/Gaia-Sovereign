# User Guide

This guide explains how to use:

- The **Consent flow** (end-user: approve/deny access requests)
- The **Developer Portal** (team/developers: register apps, manage credentials, test integrations)

## Glossary

- **Data Owner (User)**: the person who owns data stored in the Vault.
- **Third-party App**: an external client that requests access to specific fields.
- **Consent Request**: a pending request for access to certain fields.
- **Approved fields / scopes**: the exact fields the user allows the third-party app to access.
- **Access token**: token used by the third-party app to access approved fields.

## Consent flow (end-user)

### What the Consent screen does

When a third-party app requests access, you review:

- The requesting app identity
- The list of requested fields
- The request expiration (TTL)

You then choose:

- **Approve**: optionally selecting a subset of fields
- **Deny**: deny all access

### Opening the Consent screen

The consent screen is available in the Web app.

The flow is typically:

1. A third-party creates a consent request via the API.
2. The user opens the consent page:

```
http://localhost:3000/consent?id=<CONSENT_ID>
```

### Approving a request

Approval can be done in two ways:

- UI: approve all or select a subset of fields
- API: approve via endpoint

API example:

- `POST /api/consent/:id/approve`

Payload example:

```json
{
  "approvedFields": ["email", "profile", "username"]
}
```

### Denying a request

- UI: click Deny
- API: `POST /api/consent/:id/deny`

### Expiration behavior

Consent requests are time-limited.

- If a request expires, approval/denial should fail.
- The UI should show an expired/not-found state.

For end-to-end test expectations, refer to `CONSENT_TESTING_GUIDE.md`.

## Developer Portal (third-party app developer)

### What the Developer Portal provides

The Developer Portal lets you:

- Create/manage **Third-party Apps**
- Get a `clientId`
- Receive a `clientSecret` (shown only at creation/rotation time)
- Manage app status (e.g. active/blocked)
- Rotate secrets

In the Web app, the Developer Portal is implemented at:

- `apps/web/app/developer/page.tsx`

### Create a new App / API Key

From the UI, use **Create Key** and provide:

- App name
- Redirect URIs

After creation:

- Save the `clientSecret` immediately
- Treat it like a password

### Rotate a secret

Rotation generates a new secret; the old one should no longer be used.

- Rotate from the Developer Portal UI
- Save the newly issued `clientSecret`

### Using credentials to create a Consent Request

Once you have:

- `clientId`
- `clientSecret`
- a registered `redirectUri`

You can create a consent request:

- `POST /api/consent/request`

Example:

```bash
curl -X POST http://localhost:4000/api/consent/request \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "<CLIENT_ID>",
    "clientSecret": "<CLIENT_SECRET>",
    "redirectUri": "http://localhost:8000/callback",
    "requestedFields": ["email", "username", "profile"],
    "state": "random-state-123"
  }'
```

### Testing the full flow

Follow the end-to-end testing steps in:

- `CONSENT_TESTING_GUIDE.md`

## Operational notes

### Environment variables

Key configuration is documented in `.env.example`.

Notable values:

- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `JWT_SECRET`
- CORS and rate limit variables

### Security guidelines for developers

- Never commit secrets to the repository.
- Store `clientSecret` in a secret manager in production.
- Use TLS (HTTPS) outside local development.
