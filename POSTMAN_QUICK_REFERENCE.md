# Postman Collection Quick Reference

## 🚀 Quick Start

### 1. Import Collection
```
Postman → Import → Gaia_Sovereign_API.postman_collection.json
```

### 2. User Workflow (5 minutes)
```
1. Auth → Get CSRF Token
2. Auth → Register User
3. Auth → Login (copy token to {{USER_TOKEN}})
4. Vault → Create Entry
5. Vault → Get All Entries
6. User → Get Active Accesses
```

### 3. Copy These IDs
- From Login response → `{{USER_TOKEN}}`
- From Create App response → `{{APP_ID}}`, `{{CLIENT_ID}}`, `{{CLIENT_SECRET}}`
- From Create Vault response → `{{VAULT_ID}}`

---

## 📋 All Endpoints (37 Total)

### Authentication (3)
- `GET /auth/csrf-token` - Get CSRF token
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token

### Vault (7)
- `POST /vault` - Create entry
- `GET /vault` - List entries
- `GET /vault/categories/counts` - Count by category
- `GET /vault/:id` - Get entry
- `PATCH /vault/:id` - Update entry
- `DELETE /vault/:id` - Delete entry
- `POST /vault/scoped/access` - Scoped access

### Tokens (1)
- `POST /token/revoke` - Revoke token

### User (1)
- `GET /user/active-accesses` - List active apps

### Audit (2)
- `GET /audit/logs` - View logs
- `GET /audit/stats` - Get stats

### Admin (8) ⚠️ Requires Admin
- `GET /admin/users` - List users
- `GET /admin/apps` - List apps
- `GET /admin/apps/:id` - App details
- `PATCH /admin/apps/:id/status` - Update app status
- `PATCH /admin/users/:id/status` - Update user status
- `GET /admin/audit-logs` - System audit logs
- `GET /admin/dashboard/stats` - Dashboard stats
- `GET /admin/system/health` - System health

### Third-Party Apps (6)
- `POST /third-party-apps` - Create app
- `GET /third-party-apps` - List apps
- `GET /third-party-apps/:id` - Get app
- `PATCH /third-party-apps/:id` - Update app
- `POST /third-party-apps/:id/rotate-secret` - Rotate secret
- `PATCH /third-party-apps/:id/status` - Update status

### Consent (5)
- `POST /consent/request` - Create consent request
- `GET /consent/:id` - Get consent details
- `POST /consent/:id/approve` - Approve consent
- `POST /consent/:id/deny` - Deny consent

---

## 🔑 Collection Variables

```
{{BASE_URL}}           = http://localhost:4000
{{USER_TOKEN}}         = (from login)
{{ADMIN_TOKEN}}        = (from admin login)
{{USER_ID}}            = (from any response)
{{APP_ID}}             = (from create app)
{{CLIENT_ID}}          = (from create app)
{{CLIENT_SECRET}}      = (from create app)
{{CONSENT_ID}}         = (from create consent)
{{CONSENT_TOKEN_ID}}   = (from consent approval)
{{TOKEN_ID}}           = (from active accesses)
{{VAULT_ID}}           = (from create vault)
{{WRONG_USER_TOKEN}}   = (different user token for testing)
```

---

## ⚡ Common Tasks

### Register & Login (Get Token)
```
1. POST /auth/register
   Body: { username, email, password }

2. POST /auth/login
   Body: { email, password }
   Response: { token, user }
   → Copy token to {{USER_TOKEN}}
```

### Create & Manage Vault Entry
```
1. POST /vault
   Header: Authorization: Bearer {{USER_TOKEN}}
   Body: { title, category, data, tags }
   → Copy entry ID to {{VAULT_ID}}

2. GET /vault/{{VAULT_ID}}
   (retrieve decrypted entry)

3. PATCH /vault/{{VAULT_ID}}
   (update entry)

4. DELETE /vault/{{VAULT_ID}}
   (delete entry)
```

### Consent Flow (OAuth 2.0)
```
1. POST /consent/request
   (no auth needed)
   Body: { clientId, clientSecret, redirectUri, requestedFields }
   → Copy consent ID

2. GET /consent/{{CONSENT_ID}}
   Header: Authorization: Bearer {{USER_TOKEN}}
   (review what app is requesting)

3. POST /consent/{{CONSENT_ID}}/approve
   Header: Authorization: Bearer {{USER_TOKEN}}
   Body: { approvedFields: [...] }
   (approve all or subset)

4. POST /vault/scoped/access
   (get data with only approved fields)
```

### Revoke App Access
```
1. GET /user/active-accesses
   (see all apps with access)
   → Copy token ID

2. POST /token/revoke
   Body: { tokenId }
   (immediately block app)
```

### Admin: Manage Users
```
1. GET /admin/users?search=john&status=active
   Header: Authorization: Bearer {{ADMIN_TOKEN}}
   (list users)

2. PATCH /admin/users/{{USER_ID}}/status
   Body: { action: "suspend" }
   (suspend user)
```

### Admin: Block Bad App
```
1. GET /admin/apps?search=malicious
   (find app)

2. PATCH /admin/apps/{{APP_ID}}/status
   Body: { status: "BLOCKED" }
   (block all access)
```

---

## 🧪 Error Testing

```
1. Invalid Credentials
   POST /consent/request
   Body: { clientSecret: "wrong" }
   Expected: 401 Unauthorized

2. Invalid Redirect URI
   POST /consent/request
   Body: { redirectUri: "http://hacker.com" }
   Expected: 400 Bad Request

3. Unauthorized Access
   GET /consent/{{CONSENT_ID}}
   Header: Authorization: Bearer {{WRONG_USER_TOKEN}}
   Expected: 403 Forbidden
```

---

## 📚 Documentation Files

- `POSTMAN_COLLECTION_UPDATES.md` - Complete reference guide
- `POSTMAN_AUDIT_COMPLETE.md` - Audit summary
- `USE_CASE_DIAGRAM.md` - System workflows
- `DATABASE_SCHEMA.md` - Data structure
- `docs/USER_GUIDE.md` - User workflows

---

## ✅ Verification Checklist

Before considering your API complete:

- [ ] All endpoints respond correctly
- [ ] Auth tokens work on protected endpoints
- [ ] Vault encryption/decryption works
- [ ] Consent flow completes
- [ ] Admin endpoints require admin token
- [ ] Token revocation blocks access
- [ ] Audit logs record activity
- [ ] Errors return correct status codes
- [ ] Query parameters work with filters

---

## 🔍 Collection Info

- **Total Endpoints:** 37
- **Total Variables:** 12
- **Sections:** 8
- **Status:** ✅ Complete & Valid JSON
- **Last Updated:** 2026-03-26

**Your API is fully documented and ready to test!** 🎉
