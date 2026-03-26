# OpenAPI Documentation Guide

## Overview

Gaia Sovereign API is fully documented using OpenAPI 3.0 specification (formerly known as Swagger). This enables automatic API documentation, client generation, and better developer experience.

**Related Issues:**
- GS-153: As a developer, I want an OpenAPI spec so I can generate clients and document endpoints
- GS-154: Create OpenAPI spec skeleton
- GS-155: Add endpoint definitions progressively as implemented
- GS-156: Add script to validate spec in CI
- GS-157: Serve Swagger UI in staging build (protected route)

## Accessing Swagger UI

### Development Environment

The Swagger UI is automatically available at:

```
http://localhost:4000/api/docs
```

This interactive documentation allows you to:
- Browse all available endpoints
- View request/response schemas
- Test endpoints directly from the UI
- See examples and descriptions
- Generate client code (through Swagger Codegen)

### Production Environment

Swagger UI is **disabled in production** for security reasons. It can be accessed in:
- Development (`NODE_ENV=development`)
- Testing (`NODE_ENV=test`)
- Staging (`NODE_ENV=staging`)

## OpenAPI Specification

### Accessing the Spec

The raw OpenAPI specification in JSON format is available at:

```
http://localhost:4000/api-json
```

Use this for:
- Importing into API clients (Postman, Insomnia, etc.)
- Generating SDK clients
- CI/CD automation
- Documentation generation tools

### Specification Details

**Location:** Auto-generated from NestJS decorators (no manual JSON file)

**Version:** 1.0.0

**Contact:**
- Team: Gaia Sovereign Team
- Repository: https://github.com/wassim205/Gaia-Sovereign
- Email: support@gaiasovereign.dev

**Authentication:**
- Type: Bearer JWT Token
- Header: `Authorization: Bearer <token>`

## Documented Endpoints

### Auth Endpoints
- **GET** `/api/auth/csrf-token` - Get CSRF token for form submissions
- **POST** `/api/auth/register` - Create new user account
- **POST** `/api/auth/login` - Authenticate and get JWT token

### User Endpoints
- **GET** `/api/user/active-accesses` - Get all active app accesses

### Vault Endpoints
- **POST** `/api/vault` - Create new vault entry
- **GET** `/api/vault` - List vault entries
- **GET** `/api/vault/:id` - Get specific vault entry
- **PATCH** `/api/vault/:id` - Update vault entry
- **DELETE** `/api/vault/:id` - Delete vault entry
- **GET** `/api/vault/categories/counts` - Get category statistics
- **POST** `/api/vault/scoped/access` - Access scoped vault data

### Token Endpoints
- **POST** `/api/token/revoke` - Revoke an access token

### Consent Endpoints
- **POST** `/api/consent/request` - Create consent request
- **POST** `/api/consent/:id/approve` - Approve consent request
- **POST** `/api/consent/:id/deny` - Deny consent request
- **GET** `/api/consent/:id` - Get consent request details

### Audit Endpoints
- **GET** `/api/audit/logs` - Get audit logs
- **GET** `/api/audit/stats` - Get audit statistics

### Admin Endpoints
- **GET** `/api/admin/users` - List all users (admin only)
- **GET** `/api/admin/apps` - List all applications
- **GET** `/api/admin/apps/:id` - Get specific application
- **GET** `/api/admin/dashboard/stats` - Get system statistics
- **GET** `/api/admin/system/health` - Get system health status

## Adding OpenAPI Documentation

### Adding to New Endpoints

For each new endpoint, add the following decorators:

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@Controller('resource')
@ApiTags('Resources')  // Group related endpoints
@ApiBearerAuth('bearer')  // If authentication required
export class ResourceController {
  @Post()
  @ApiOperation({
    summary: 'Create resource',
    description: 'Create a new resource with the provided data',
  })
  @ApiResponse({
    status: 201,
    description: 'Resource created successfully',
    schema: {
      example: {
        message: 'Resource created',
        data: { id: 'uuid', name: 'Example' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(@Body() dto: CreateResourceDto) {
    // Implementation
  }
}
```

### Key Decorators

- **`@ApiTags(...tags)`** - Group related endpoints for organization
- **`@ApiBearerAuth('bearer')`** - Mark endpoint as requiring JWT authentication
- **`@ApiOperation()`** - Add title and description
- **`@ApiResponse()`** - Document possible responses with examples
- **`@ApiParam()`** - Document URL parameters
- **`@ApiQuery()`** - Document query parameters
- **`@ApiBody()`** - Document request body

## Validation

### Manual Validation

Run the OpenAPI validation script:

```bash
cd apps/api
npm run docs:validate
```

This will:
1. Generate the OpenAPI specification
2. Validate all endpoints are documented
3. Check for required fields (summary, responses)
4. Generate `openapi.json` file
5. Report any issues

**Expected Output:**
```
🔍 Validating OpenAPI specification...

📊 OpenAPI Specification Report:
   Total Endpoints: 25
   API Version: 1.0.0

✅ OpenAPI specification is valid!

✨ All 25 endpoints are properly documented

💾 OpenAPI spec saved to: ./openapi.json
```

### Automated CI Validation

The validation script runs automatically in CI pipeline:

**Trigger:** Pull requests and pushes to `dev` or `main` branches

**Location:** `.github/workflows/backend-ci.yml`

**Step:** "Validate OpenAPI specification"

**Failure Criteria:**
- Missing endpoint documentation
- Missing response definitions
- Invalid specification structure

## Generating Client SDKs

The OpenAPI spec can be used to generate client libraries in multiple languages:

### Using OpenAPI Generator

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g typescript \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g python \
  -o ./generated-client-python

# Generate Go client
openapi-generator-cli generate \
  -i http://localhost:4000/api-json \
  -g go \
  -o ./generated-client-go
```

### Using Swagger Codegen

```bash
# Generate Swift iOS client
swagger-codegen generate \
  -i http://localhost:4000/api-json \
  -l swift \
  -o ./ios-client
```

## Integration with Tools

### Postman

1. Open Postman
2. Click "Import"
3. Select "Link"
4. Paste: `http://localhost:4000/api-json`
5. Import

### Insomnia

1. Open Insomnia
2. Dashboard → Create → API Spec
3. Select "OpenAPI 3.0"
4. Paste: `http://localhost:4000/api-json`

### VS Code

Install the "OpenAPI Preview" extension and open:
```
http://localhost:4000/api-json
```

## Best Practices

1. **Document as You Code** - Add OpenAPI decorators when implementing endpoints
2. **Provide Examples** - Include realistic example responses in `@ApiResponse()`
3. **Clear Descriptions** - Use concise but descriptive summaries and descriptions
4. **Group Endpoints** - Use `@ApiTags()` to organize related endpoints
5. **Document Errors** - Include all possible HTTP status codes and error scenarios
6. **Keep it Updated** - Validate spec in CI to catch missing documentation

## Troubleshooting

### Swagger UI Not Available

**Problem:** Getting 404 at `/api/docs`

**Solution:** 
- Check that `NODE_ENV` is not `production`
- Ensure API is running on correct port
- Check API logs for startup errors

### Missing Endpoints in Swagger

**Problem:** Implemented endpoint doesn't appear in Swagger UI

**Solution:**
- Add `@ApiTags()` to controller
- Add `@ApiOperation()` to endpoint method
- Add `@ApiResponse()` to document responses
- Run `npm run docs:validate` to identify missing documentation

### Swagger UI Styles Not Loading

**Problem:** Swagger UI loads but without styling

**Solution:**
- Clear browser cache
- Ensure CDN URLs are accessible
- Check CORS configuration

## Related Files

- **Main Setup:** `apps/api/src/main.ts`
- **Validation Script:** `apps/api/scripts/validate-openapi.ts`
- **CI Configuration:** `.github/workflows/backend-ci.yml`
- **Package Scripts:** `apps/api/package.json`
- **Decorated Controllers:**
  - `apps/api/src/auth/auth.controller.ts`
  - `apps/api/src/users/users.controller.ts`
  - `apps/api/src/tokens/token.controller.ts`
  - `apps/api/src/vault/vault.controller.ts`

## Next Steps

1. **Complete Endpoint Documentation** - Add decorators to remaining controllers
2. **Add DTOs** - Document request/response data transfer objects
3. **Generate Client SDK** - Create officially supported client libraries
4. **Setup Documentation Site** - Host documentation on dedicated domain
5. **API Versioning** - Plan for v2 with backward compatibility

## References

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
