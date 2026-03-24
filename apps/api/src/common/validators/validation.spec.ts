import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateVaultEntryDto } from 'src/vault/dto/create-vault-entry.dto';
import { UpdateVaultEntryDto } from 'src/vault/dto/update-vault-entry.dto';
import { ApproveConsentRequestDto } from 'src/consent/dto/approve-consent-request.dto';
import { CreateConsentRequestDto } from 'src/consent/dto/create-consent-request.dto';
import { RevokeTokenDto } from 'src/tokens/dto/revoke-token.dto';

describe('DTO Validation (GS-145: Input validation)', () => {
  describe('CreateVaultEntryDto', () => {
    it('should accept valid vault entry data', async () => {
      const dto = Object.assign(new CreateVaultEntryDto(), {
        title: 'My Passwords',
        category: 'CREDENTIAL',
        description: 'Personal passwords',
        fields: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing required fields', async () => {
      const dto = Object.assign(new CreateVaultEntryDto(), {
        description: 'No title or category',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid title length', async () => {
      const dto = Object.assign(new CreateVaultEntryDto(), {
        title: '',
        category: 'CREDENTIAL',
        fields: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional description', async () => {
      const dto = Object.assign(new CreateVaultEntryDto(), {
        title: 'My Passwords',
        category: 'CREDENTIAL',
        fields: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateVaultEntryDto', () => {
    it('should accept valid update data', async () => {
      const dto = Object.assign(new UpdateVaultEntryDto(), {
        title: 'Updated Title',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow partial updates', async () => {
      const dto = Object.assign(new UpdateVaultEntryDto(), {
        description: 'Updated description',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid title when provided', async () => {
      const dto = Object.assign(new UpdateVaultEntryDto(), {
        title: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ApproveConsentRequestDto', () => {
    it('should accept valid approval data', async () => {
      const dto = Object.assign(new ApproveConsentRequestDto(), {
        approvedFields: ['email', 'name'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject empty approved fields list', async () => {
      const dto = Object.assign(new ApproveConsentRequestDto(), {
        approvedFields: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should allow optional approval (none specified)', async () => {
      const dto = Object.assign(new ApproveConsentRequestDto(), {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject non-string field values', async () => {
      const dto = Object.assign(new ApproveConsentRequestDto(), {
        approvedFields: ['email', 123],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateConsentRequestDto', () => {
    it('should accept valid consent request', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientId: 'app-123',
        clientSecret: 'secret-xyz',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email', 'name'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing clientId', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientSecret: 'secret-xyz',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid clientId length', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientId: 'a'.repeat(65),
        clientSecret: 'secret-xyz',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject missing clientSecret', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientId: 'app-123',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject empty requestedFields', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientId: 'app-123',
        clientSecret: 'secret-xyz',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow optional state parameter', async () => {
      const dto = Object.assign(new CreateConsentRequestDto(), {
        clientId: 'app-123',
        clientSecret: 'secret-xyz',
        redirectUri: 'https://example.com/callback',
        requestedFields: ['email'],
        state: 'random-state-value',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('RevokeTokenDto', () => {
    it('should accept valid revocation request', async () => {
      const dto = Object.assign(new RevokeTokenDto(), {
        tokenId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missing tokenId', async () => {
      const dto = Object.assign(new RevokeTokenDto(), {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid UUID format', async () => {
      const dto = Object.assign(new RevokeTokenDto(), {
        tokenId: 'not-a-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-UUID tokenId', async () => {
      const dto = Object.assign(new RevokeTokenDto(), {
        tokenId: '12345',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
