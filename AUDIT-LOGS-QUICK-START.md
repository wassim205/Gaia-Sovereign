# Quick Start Guide - Audit Logs & Active Accesses

## Accessing the Application

### Frontend
- **URL**: http://localhost:3000
- **API**: http://localhost:4000/api

### Login Credentials
Use any credentials to create an account:
- Email: anything@example.com
- Password: any password (minimum requirements apply)

## Navigation to Features

### Audit Logs Page
1. Login at http://localhost:3000
2. Click **"Audit Log"** in the left sidebar
3. Or navigate directly to: http://localhost:3000/dashboard/history

### Active Accesses Page
1. Login at http://localhost:3000
2. Click **"Access Control"** in the left sidebar
3. Or navigate directly to: http://localhost:3000/active-accesses

## API Endpoints

### Get Audit Logs
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/audit/logs?limit=20&offset=0"
```

**Query Parameters**:
- `from` - Start date (ISO format: YYYY-MM-DD)
- `to` - End date (ISO format: YYYY-MM-DD)
- `action` - Filter by action type (VAULT_READ, VAULT_WRITE, etc.)
- `status` - Filter by status (success, failed, denied)
- `limit` - Records per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Response Example**:
```json
{
  "data": [
    {
      "id": "abc123",
      "action": "VAULT_READ",
      "resourceType": "VAULT_ENTRY",
      "resourceId": "entry-id-123",
      "appId": "app-123",
      "appName": "My App",
      "approvedFields": ["email", "name"],
      "accessedFields": ["email"],
      "status": "success",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-03-18T10:35:49.123Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Get Audit Statistics
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/audit/stats"
```

**Response Example**:
```json
{
  "totalLogs": 250,
  "successCount": 240,
  "failedCount": 8,
  "deniedCount": 2,
  "actionBreakdown": {
    "VAULT_READ": 150,
    "CONSENT_APPROVE": 50,
    "TOKEN_REVOKE": 25,
    "VAULT_WRITE": 20,
    "CONSENT_DENY": 5
  },
  "last24Hours": 45,
  "last7Days": 180
}
```

### Get Active Accesses
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:4000/api/user/active-accesses"
```

**Response Example**:
```json
{
  "data": [
    {
      "id": "token-123",
      "appId": "app-123",
      "appName": "My Third Party App",
      "approvedFields": ["email", "name", "phone"],
      "issuedAt": "2026-03-15T10:35:49.123Z",
      "expiresAt": "2026-06-15T10:35:49.123Z",
      "status": "active"
    }
  ]
}
```

### Revoke Access Token
```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tokenId": "token-123"}' \
  "http://localhost:4000/api/token/revoke"
```

**Response**:
```json
{
  "message": "Token revoked successfully"
}
```

## Features Overview

### Audit Logs Page Features
✅ **Filter Controls**
- Date range picker (From/To)
- Action type dropdown
- Status filter (Success/Failed/Denied)
- Search/query support
- Clear filters button

✅ **Log Display**
- Action type with icon
- Resource information
- Application name
- Status with color coding
- Timestamp

✅ **Expandable Details**
- Full timestamp
- IP address
- Field tracking (approved/accessed/requested)
- User agent
- Complete resource details

✅ **User Actions**
- Refresh logs
- Export to CSV
- Load more pagination

### Active Accesses Page Features
✅ **Token List**
- Application name
- Approved fields
- Issue date
- Expiration date
- Current status

✅ **Token Management**
- Revoke button with confirmation modal
- Status indicators
- Permission summary

## Docker Commands

```bash
# View API logs
docker compose logs api -f

# View Database logs
docker compose logs db -f

# View Web logs
docker compose logs web -f

# Restart API (after code changes)
docker compose restart api

# Full rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Check health status
docker compose ps

# Access database
docker compose exec db psql -U postgres
```

## Troubleshooting

### Frontend not loading
1. Check if port 3000 is accessible: `curl http://localhost:3000`
2. Check web logs: `docker compose logs web`
3. Rebuild web: `docker compose build web && docker compose restart web`

### API not responding
1. Check API logs: `docker compose logs api`
2. Verify database is running: `docker compose ps | grep db`
3. Check port 4000: `curl http://localhost:4000/api`
4. Restart API: `docker compose restart api`

### Database connection issues
1. Check database status: `docker compose ps db`
2. Verify database health: look for "(healthy)" in ps output
3. Check database logs: `docker compose logs db`
4. Reset database: `docker compose down -v && docker compose up -d`

### Token authentication errors
1. Ensure you're logged in first
2. Get token from localStorage after login: `localStorage.getItem('token')`
3. Include full JWT in Authorization header
4. Check token expiration: JWTs expire after set duration

## Performance Tips

1. **CSV Export**: Limited to ~1000 records at a time
2. **Filtering**: Use date range and action filters to reduce data
3. **Pagination**: Load 20 records at a time, use "Load More" button
4. **Audit Retention**: Logs older than 90 days are auto-archived

## Security Notes

✅ All API endpoints require JWT authentication
✅ Users can only access their own audit logs
✅ Token revocation is validated for user ownership
✅ IP addresses and user agents are logged
✅ Status tracking prevents unauthorized access attempts

## Support & Documentation

- Full documentation: See `GS-13-GS-125-COMPLETION-SUMMARY.md`
- API schema: See `apps/api/src/audit/` and `apps/api/src/tokens/`
- Frontend components: See `apps/web/app/dashboard/history/page.tsx`
- Database schema: See `apps/api/prisma/schema.prisma`
