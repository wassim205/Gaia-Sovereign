# OpenAPI Examples & Usage

Quick reference for accessing and using the Gaia Sovereign API documentation and making API calls.

## Accessing Documentation

### Interactive Swagger UI
```
http://localhost:4000/api/docs
```

### Raw OpenAPI JSON Specification
```
http://localhost:4000/api-json
```

### Download OpenAPI Spec
```bash
curl http://localhost:4000/api-json > openapi.json
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Getting a Token

1. **Register a new user:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response Example:**
```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

---

## API Examples

### Auth Endpoints

#### 1. Get CSRF Token
```bash
curl -X GET http://localhost:4000/api/auth/csrf-token \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "CSRF token generated successfully",
  "data": {
    "csrfToken": "hex_string_32_chars_long"
  }
}
```

#### 2. User Registration
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_smith",
    "email": "jane@example.com",
    "password": "MySecurePass123!"
  }'
```

#### 3. User Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "MySecurePass123!"
  }'
```

---

### User Endpoints

#### Get Active Accesses (requires token)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:4000/api/user/active-accesses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Active accesses retrieved successfully",
  "data": [
    {
      "id": "token-uuid",
      "appId": "app-uuid",
      "appName": "ShopNow",
      "appStatus": "ACTIVE",
      "approvedFields": ["name", "email", "phone"],
      "expiresAt": "2026-12-26T10:00:00Z",
      "createdAt": "2026-03-26T10:00:00Z",
      "isExpired": false
    }
  ],
  "count": 1
}
```

---

### Vault Endpoints

#### Create Vault Entry
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:4000/api/vault \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password",
    "category": "finance",
    "title": "Bank Account Password",
    "username": "john_doe_123",
    "password": "BankPassword123!",
    "url": "https://bank.example.com",
    "notes": "Main checking account"
  }'
```

#### List Vault Entries
```bash
curl -X GET http://localhost:4000/api/vault \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Single Vault Entry
```bash
ENTRY_ID="uuid-here"

curl -X GET http://localhost:4000/api/vault/$ENTRY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Update Vault Entry
```bash
ENTRY_ID="uuid-here"

curl -X PATCH http://localhost:4000/api/vault/$ENTRY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Bank Account",
    "notes": "Primary savings account"
  }'
```

#### Delete Vault Entry
```bash
ENTRY_ID="uuid-here"

curl -X DELETE http://localhost:4000/api/vault/$ENTRY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Vault Categories Count
```bash
curl -X GET http://localhost:4000/api/vault/categories/counts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

### Token Endpoints

#### Revoke Access Token
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
TOKEN_ID="token-to-revoke-uuid"

curl -X POST http://localhost:4000/api/token/revoke \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tokenId\": \"$TOKEN_ID\"
  }"
```

**Response:**
```json
{
  "message": "Token revoked successfully",
  "data": {
    "id": "token-uuid",
    "appId": "app-uuid",
    "revokedAt": "2026-03-26T10:15:00Z"
  }
}
```

---

## Error Responses

### Invalid Credentials
```json
{
  "message": "Unauthorized",
  "error": "Invalid email or password",
  "statusCode": 401
}
```

### Validation Error
```json
{
  "message": "Bad Request",
  "error": [
    "email must be an email",
    "password must be at least 8 characters long"
  ],
  "statusCode": 400
}
```

### Forbidden
```json
{
  "message": "Forbidden",
  "error": "You can only revoke your own tokens",
  "statusCode": 403
}
```

### Not Found
```json
{
  "message": "Not Found",
  "error": "Vault entry not found",
  "statusCode": 404
}
```

---

## Using with Postman

### Import OpenAPI Spec

1. Open Postman
2. Click **Import** button
3. Select **Link** tab
4. Paste: `http://localhost:4000/api-json`
5. Click **Continue** and **Import**

### Testing Endpoints

1. Create a collection for testing
2. Add requests for each endpoint
3. Use **Pre-request Script** tab to set up token:
```javascript
// Set token from login response
pm.environment.set("jwt_token", pm.response.json().data.token);
```

4. Use variable in Authorization header:
```
Bearer {{jwt_token}}
```

---

## Using with cURL Script

Save as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:4000/api"

echo "🔐 Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!"
  }')

echo "✅ Registration successful"

echo "🔑 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

echo "✅ Login successful"
echo "Token: $TOKEN"

echo "📋 Getting active accesses..."
curl -s -X GET "$BASE_URL/user/active-accesses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo "✨ API tests complete!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|--------------|
| 200 | OK | Successful GET, POST, PATCH |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | No permission for action |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:

- **General endpoints:** 100 requests/minute per IP
- **Auth endpoints:** 10 requests/minute per IP
- **Vault endpoints:** 60 requests/minute per user

Headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648296060
```

---

## CORS Configuration

Allowed origins (configurable):
- `http://localhost:3000` (development)
- `http://localhost:8080` (development)
- `https://yourdomain.com` (production)

Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

Headers: `Content-Type`, `Authorization`, `X-CSRF-Token`, `X-Client-Id`

---

## Troubleshooting

### "Cannot GET /api/docs"
- Check API is running: `docker ps`
- Verify port: `curl http://localhost:4000/api`
- Check NODE_ENV: Not "production"

### "Invalid Token"
- Token has expired (usually 24 hours)
- Login again to get new token
- Token is malformed

### "Request blocked by CORS"
- Check if origin is in allowed list
- Verify Content-Type header
- Check browser console for details

### Swagger UI Styling Missing
- Clear browser cache (Ctrl+F5)
- Check CDN URLs are accessible
- Try different browser

---

## Additional Resources

- **NestJS Swagger:** https://docs.nestjs.com/openapi/introduction
- **OpenAPI Spec:** https://spec.openapis.org/oas/v3.0.3
- **Postman Docs:** https://learning.postman.com/docs/getting-started/introduction/
- **cURL Tutorial:** https://curl.se/docs/manual.html

---

## Next Steps

1. **Explore** the interactive Swagger UI
2. **Try** API calls with provided examples
3. **Generate** client SDKs in your language
4. **Integrate** into your application
5. **Reference** OpenAPI documentation for advanced features
