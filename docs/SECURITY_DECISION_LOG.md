# Security Decision Log (SDL)

This document records key security/architecture decisions for Gaia Sovereign (Personal Data Vault) so the team can onboard faster and justify design choices.

## Scope

This log covers:

- Field-level encryption (why per-field and how keys are derived)
- Token type for third-party access (why JWT + DB-backed revocation)
- KMS strategy (why we abstract KMS and what is implemented today)

## Decision 1: Encrypt vault data per-field (field-level encryption)

### Context

Vault data is composed of many independent fields (e.g., `email`, `username`, `phone`, `profile`, etc.). Third-party access is granted *per-field* via consent scopes.

We need encryption at rest that:

- Limits blast radius when a subset of data is accessed/processed
- Aligns with field-level scopes (consent approves specific fields)
- Supports future key rotation
- Keeps plaintext out of persistence

### Decision

We encrypt values at the field level using **AES-256-GCM** and store ciphertext in the database.

Key derivation is designed to support **per-user** and **per-field** derived keys.

### Current implementation (code references)

- `apps/api/src/common/services/encryption.service.ts`
  - AES-256-GCM encryption/decryption
  - `encryptFields()` / `decryptFields()` to process multiple fields

- `apps/api/src/common/services/key-management.service.ts`
  - `deriveKeyForUser(userId, masterKey, keyVersion)`
  - `deriveKeyForField(userId, fieldKey, masterKey, keyVersion)`
  - `ENCRYPTION_MASTER_SALT` support
  - KMS abstraction placeholder (`getKeyFromKms()` not implemented)

- `apps/api/src/common/services/encryption-service-v2.service.ts`
  - Metadata-aware encryption payloads (nonce/tag/salt/keyVersion)
  - Helper functions for re-encryption decisions (`needsReencryption()`)

### Alternatives considered

- **Single record-level encryption (encrypt the whole object)**
  - Pros: simpler schema
  - Cons: cannot easily share a subset of fields; increases blast radius; complicates selective disclosure

- **Database-native encryption (e.g., pgcrypto)**
  - Pros: fewer app-level crypto concerns
  - Cons: portability concerns; harder to rotate/standardize; less explicit control over envelope/KMS patterns

### Rationale

- Aligns with the product’s primary security model: *field-level consent*.
- Minimizes accidental over-sharing: only requested/approved fields are decrypted/returned.
- Limits impact of bugs or misconfigurations (smaller plaintext surface).

### Consequences

- More ciphertext rows/columns than record-level encryption.
- Key-derivation rules must remain stable; changes require a migration/reencryption strategy.
- More careful validation of `fieldKey` normalization is required to avoid duplicating keys for the “same” field.

## Decision 2: Use JWT access tokens but enforce DB-backed revocation (“JWT as bearer, DB as source of truth”)

### Context

Third-party apps need a time-limited, scoped access token after consent approval.

We must support:

- Scopes = approved fields
- Expiration
- Immediate revocation
- Auditability

### Decision

Use a **signed JWT** as the access token presented by third parties, while also storing a **hash of the token** in the database.

At request time we validate:

1. JWT signature and expiry
2. Token presence in DB (must exist)
3. Revocation status in DB (`revokedAt` must be null)
4. DB expiry (`expiresAt`) as an additional safety check

### Current implementation (code references)

- `apps/api/src/tokens/token.service.ts`
  - JWT payload includes `sub`, `app_id`, `approved_fields`, `iat`, `exp`
  - Stores `sha256(token)` in `accessToken` table
  - Validates against DB for revocation

- `apps/api/src/tokens/token-validation.guard.ts`
  - Applies token validation to protected Vault endpoints (for third-party style access paths)

- `apps/api/src/tokens/token.controller.ts`
  - Token revocation endpoint for the user: `POST /api/token/revoke`

### Alternatives considered

- **Pure JWT (stateless)**
  - Pros: no DB lookup
  - Cons: revocation is hard/impossible without a blacklist; operational risk if tokens leak

- **Pure opaque token**
  - Pros: DB is authoritative; easy revocation
  - Cons: requires DB lookup anyway; harder to introspect/debug without an “introspection endpoint”; requires token format decisions

### Rationale

- Keeps the token compact and standards-aligned (JWT), while retaining operational controls (revocation) through DB lookup.
- Prevents “forever valid” tokens in case of compromise.
- Avoids storing raw bearer tokens by storing only a hash.

### Consequences

- Every token-protected API call requires a DB lookup.
- Need rate limiting and caching strategy if traffic grows.

## Decision 3: KMS strategy: abstract KMS support, derive keys locally by default

### Context

We want to support secure key storage and rotation. In development/small deployments, we can derive keys locally. In enterprise deployments, the master key material should be backed by a Key Management System (AWS KMS, GCP KMS, HashiCorp Vault, etc.).

### Decision

- Implement a **Key Management abstraction** that supports:
  - Local key derivation for development
  - Future KMS integration without changing encryption call sites

### Current implementation (code references)

- `apps/api/src/common/services/key-management.service.ts`
  - Derivation uses `scrypt` with HMAC-derived salt
  - `getKeyFromKms()` exists but intentionally rejects (integration not implemented yet)

### Alternatives considered

- **KMS-only approach**
  - Pros: strong guarantees around key custody
  - Cons: increases operational complexity and cost; harder for local development

- **Local-only approach**
  - Pros: simple
  - Cons: weaker key custody; harder to justify for production

### Rationale

- Keeps onboarding easy and development friction low.
- Provides a clear path to production-hardening.

### Consequences

- Until KMS is implemented, production deployments must treat local master keys as sensitive and protect them accordingly.

## Related documentation

- `CONSENT_TESTING_GUIDE.md`
- `DATABASE_SCHEMA.md`
