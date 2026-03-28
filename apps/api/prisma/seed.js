const { PrismaClient, UserRole } = require('@prisma/client');
const argon2 = require('argon2');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Encryption utilities (matching encryption.service.ts)
const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;
const saltLength = 32;

function deriveKey(masterKey, salt) {
  return crypto.scryptSync(masterKey, salt, keyLength);
}

function encryptField(plaintext, masterKey) {
  const salt = crypto.randomBytes(saltLength);
  const iv = crypto.randomBytes(ivLength);
  const key = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

/**
 * Comprehensive seeder for demo purposes
 * Creates realistic data to showcase all project features
 */
async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // Hash passwords
  const hashedPassword = await argon2.hash('Demo123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // ============================================
  // 1. SEED USERS
  // ============================================
  console.log('👥 Seeding Users...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gaia.local' },
    update: {},
    create: {
      username: 'admin_master',
      email: 'admin@gaia.local',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: 1,
      encryptedMasterKey: 'admin-master-key-encrypted',
    },
  });

  // Master keys must be consistent for encryption/decryption
  const johnMasterKey = 'john-master-key-demo-secret-123';
  const janeMasterKey = 'jane-master-key-demo-secret-456';

  const demoUser1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      username: 'john_doe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      status: 1,
      encryptedMasterKey: johnMasterKey,
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      username: 'jane_smith',
      email: 'jane.smith@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      status: 1,
      encryptedMasterKey: janeMasterKey,
    },
  });

  console.log('  ✓ Admin user: admin@gaia.local');
  console.log('  ✓ Demo user 1: john.doe@example.com');
  console.log('  ✓ Demo user 2: jane.smith@example.com');
  console.log('  Password for all: Demo123!\n');

  // ============================================
  // 2. SEED VAULT ENTRIES WITH FIELDS
  // ============================================
  console.log('🔐 Seeding Vault Entries...');

  // John's vault entries
  const johnBankEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser1.id,
      title: 'Bank Account - Wells Fargo',
      category: 'CREDENTIAL',
      description: 'Primary checking account',
      isFavorite: true,
      fields: {
        create: [
          {
            fieldKey: 'username',
            encryptedValue: encryptField('john.doe', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'password',
            encryptedValue: encryptField('WellsFargo@123!', johnMasterKey),
            fieldType: 'password',
          },
          {
            fieldKey: 'url',
            encryptedValue: encryptField('https://wellsfargo.com', johnMasterKey),
            fieldType: 'text',
          },
        ],
      },
    },
  });

  const johnGmailEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser1.id,
      title: 'Gmail Account',
      category: 'CREDENTIAL',
      description: 'Personal email account',
      fields: {
        create: [
          {
            fieldKey: 'email',
            encryptedValue: encryptField('john.doe@gmail.com', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'password',
            encryptedValue: encryptField('GmailPassword@456!', johnMasterKey),
            fieldType: 'password',
          },
        ],
      },
    },
  });

  const johnCardEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser1.id,
      title: 'Visa Credit Card',
      category: 'CREDENTIAL',
      description: 'Primary credit card',
      isFavorite: true,
      fields: {
        create: [
          {
            fieldKey: 'cardNumber',
            encryptedValue: encryptField('4111111111111111', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'cardName',
            encryptedValue: encryptField('John Doe', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'cvv',
            encryptedValue: encryptField('123', johnMasterKey),
            fieldType: 'password',
          },
          {
            fieldKey: 'expiry',
            encryptedValue: encryptField('12/26', johnMasterKey),
            fieldType: 'text',
          },
        ],
      },
    },
  });

  const johnGithubEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser1.id,
      title: 'GitHub Developer Account',
      category: 'CREDENTIAL',
      description: 'Development account with PAT',
      fields: {
        create: [
          {
            fieldKey: 'username',
            encryptedValue: encryptField('john-developer', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'personalAccessToken',
            encryptedValue: encryptField('ghp_demotoken1234567890abcdefghijklmnop', johnMasterKey),
            fieldType: 'password',
          },
          {
            fieldKey: 'url',
            encryptedValue: encryptField('https://github.com', johnMasterKey),
            fieldType: 'text',
          },
        ],
      },
    },
  });

  const johnPassportEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser1.id,
      title: 'Passport Information',
      category: 'DOCUMENT',
      description: 'Passport details for travel',
      fields: {
        create: [
          {
            fieldKey: 'passportNumber',
            encryptedValue: encryptField('123456789', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'issuingCountry',
            encryptedValue: encryptField('United States', johnMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'expiryDate',
            encryptedValue: encryptField('2030-12-31', johnMasterKey),
            fieldType: 'text',
          },
        ],
      },
    },
  });

  // Jane's vault entries
  const janeInvestmentEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser2.id,
      title: 'Investment Trading Account',
      category: 'CREDENTIAL',
      description: 'Fidelity investment account',
      isFavorite: true,
      fields: {
        create: [
          {
            fieldKey: 'accountNumber',
            encryptedValue: encryptField('123456789-FIDELITY', janeMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'username',
            encryptedValue: encryptField('jane.smith.investor', janeMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'password',
            encryptedValue: encryptField('InvestPass@789!', janeMasterKey),
            fieldType: 'password',
          },
        ],
      },
    },
  });

  const janeHealthEntry = await prisma.vaultEntry.create({
    data: {
      userId: demoUser2.id,
      title: 'Health Insurance Portal',
      category: 'CREDENTIAL',
      description: 'Blue Shield insurance account',
      fields: {
        create: [
          {
            fieldKey: 'memberId',
            encryptedValue: encryptField('BS-123456789-JAN', janeMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'username',
            encryptedValue: encryptField('jane_smith_health', janeMasterKey),
            fieldType: 'text',
          },
          {
            fieldKey: 'password',
            encryptedValue: encryptField('HealthPass@999!', janeMasterKey),
            fieldType: 'password',
          },
        ],
      },
    },
  });

  console.log('  ✓ Created 5 vault entries for John');
  console.log('  ✓ Created 2 vault entries for Jane\n');

  // ============================================
  // 3. SEED THIRD-PARTY APPS
  // ============================================
  console.log('🚀 Seeding Third-Party Applications...');

  const shopNowApp = await prisma.thirdPartyApp.create({
    data: {
      ownerId: adminUser.id,
      name: 'ShopNow',
      description: 'E-commerce shopping platform - Complete your shopping experience',
      clientId: 'shopnow-client-id-' + Date.now(),
      secretHash: 'shopnow-secret-hashed-key-123',
      redirectUris: ['https://shopnow.example.com/callback'],
      status: 'ACTIVE',
    },
  });

  const deliverItApp = await prisma.thirdPartyApp.create({
    data: {
      ownerId: adminUser.id,
      name: 'DeliverIt',
      description: 'Food and package delivery service with real-time tracking',
      clientId: 'deliverit-client-id-' + Date.now(),
      secretHash: 'deliverit-secret-hashed-key-456',
      redirectUris: ['https://deliverit.example.com/callback'],
      status: 'ACTIVE',
    },
  });

  const socialHubApp = await prisma.thirdPartyApp.create({
    data: {
      ownerId: adminUser.id,
      name: 'SocialHub',
      description: 'Social networking platform connecting friends globally',
      clientId: 'socialhub-client-id-' + Date.now(),
      secretHash: 'socialhub-secret-hashed-key-789',
      redirectUris: ['https://socialhub.example.com/callback'],
      status: 'ACTIVE',
    },
  });

  const bankAppInactive = await prisma.thirdPartyApp.create({
    data: {
      ownerId: adminUser.id,
      name: 'BankApp',
      description: 'Mobile banking application',
      clientId: 'bankapp-client-id-' + Date.now(),
      secretHash: 'bankapp-secret-hashed-key-999',
      redirectUris: ['https://bankapp.example.com/callback'],
      status: 'BLOCKED',
    },
  });

  console.log('  ✓ ShopNow (ACTIVE)');
  console.log('  ✓ DeliverIt (ACTIVE)');
  console.log('  ✓ SocialHub (ACTIVE)');
  console.log('  ✓ BankApp (BLOCKED)\n');

  // ============================================
  // 4. SEED ACCESS TOKENS
  // ============================================
  console.log('� Seeding Access Tokens...');

  const shopNowToken = await prisma.accessToken.create({
    data: {
      tokenHash: 'hashed-token-shopnow-john-' + Date.now(),
      appId: shopNowApp.id,
      userId: demoUser1.id,
      approvedFields: ['email', 'phone', 'address', 'name'],
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const deliverItTokenJohn = await prisma.accessToken.create({
    data: {
      tokenHash: 'hashed-token-deliverit-john-' + Date.now(),
      appId: deliverItApp.id,
      userId: demoUser1.id,
      approvedFields: ['phone', 'address', 'name'],
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  const socialHubToken = await prisma.accessToken.create({
    data: {
      tokenHash: 'hashed-token-socialhub-john-' + Date.now(),
      appId: socialHubApp.id,
      userId: demoUser1.id,
      approvedFields: ['email', 'name'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const deliverItTokenJane = await prisma.accessToken.create({
    data: {
      tokenHash: 'hashed-token-deliverit-jane-' + Date.now(),
      appId: deliverItApp.id,
      userId: demoUser2.id,
      approvedFields: ['email', 'phone', 'address', 'name'],
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  ✓ 4 access tokens created\n');

  // ============================================
  // 5. SEED CONSENT REQUESTS
  // ============================================
  console.log('📋 Seeding Consent Requests...');

  const consentReq1 = await prisma.consentRequest.create({
    data: {
      appId: shopNowApp.id,
      redirectUri: 'https://shopnow.example.com/callback',
      requestedFields: ['name', 'email', 'phone', 'address', 'payment_method'],
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const consentReq2 = await prisma.consentRequest.create({
    data: {
      appId: deliverItApp.id,
      redirectUri: 'https://deliverit.example.com/callback',
      requestedFields: ['name', 'phone', 'address'],
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  const consentReq3 = await prisma.consentRequest.create({
    data: {
      appId: socialHubApp.id,
      redirectUri: 'https://socialhub.example.com/callback',
      requestedFields: ['name', 'email', 'profile_picture'],
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const consentReq4 = await prisma.consentRequest.create({
    data: {
      appId: shopNowApp.id,
      redirectUri: 'https://shopnow.example.com/callback',
      requestedFields: ['name', 'email', 'phone'],
      status: 'REJECTED',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  ✓ 4 consent requests created\n');

  // ============================================
  // 6. SEED AUDIT LOGS
  // ============================================
  console.log('📊 Seeding Audit Logs...');

  const auditLogs = await prisma.auditLog.createMany({
    data: [
      {
        userId: demoUser1.id,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: demoUser1.id,
        details: 'User logged in successfully from web browser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        status: 'success',
      },
      {
        userId: demoUser1.id,
        action: 'VAULT_CREATED',
        resourceType: 'vault',
        resourceId: johnBankEntry.id,
        details: 'Bank account password added to vault',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
      {
        userId: demoUser1.id,
        action: 'CONSENT_APPROVED',
        resourceType: 'consent',
        resourceId: shopNowApp.id,
        appId: shopNowApp.id,
        approvedFields: ['name', 'email', 'phone', 'address'],
        details: 'User approved ShopNow app access',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
      {
        userId: demoUser1.id,
        action: 'TOKEN_ACCESS',
        resourceType: 'token',
        resourceId: shopNowToken.id,
        appId: shopNowApp.id,
        accessedFields: ['email', 'name'],
        details: 'ShopNow accessed user data via approved token',
        ipAddress: '192.168.1.150',
        userAgent: 'ShopNow-API-Client/1.0',
        status: 'success',
      },
      {
        userId: demoUser2.id,
        action: 'LOGIN',
        resourceType: 'auth',
        resourceId: demoUser2.id,
        details: 'User logged in successfully from mobile app',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
        status: 'success',
      },
      {
        userId: demoUser2.id,
        action: 'VAULT_CREATED',
        resourceType: 'vault',
        resourceId: janeInvestmentEntry.id,
        details: 'Investment account added to vault',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
      {
        userId: demoUser2.id,
        action: 'CONSENT_DENIED',
        resourceType: 'consent',
        resourceId: shopNowApp.id,
        appId: shopNowApp.id,
        requestedFields: ['name', 'email', 'phone'],
        details: 'User denied ShopNow app access to personal data',
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
      {
        userId: adminUser.id,
        action: 'ADMIN_VIEW_USER',
        resourceType: 'admin',
        resourceId: demoUser1.id,
        details: 'Admin viewed user profile and vault statistics',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
      {
        userId: demoUser1.id,
        action: 'VAULT_UPDATED',
        resourceType: 'vault',
        resourceId: johnBankEntry.id,
        details: 'Bank account vault entry updated',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`  ✓ Created ${auditLogs.count} audit logs\n`);

  // ============================================
  // 7. DISPLAY SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('✅ SEEDING COMPLETE - Demo Data Successfully Populated');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  console.log('👥 DEMO USER ACCOUNTS:');
  console.log('  ┌─ Admin Account');
  console.log('  │  Email: admin@gaia.local | Password: Demo123!');
  console.log('  │  Role: ADMIN | Status: Active');
  console.log('  │');
  console.log('  ├─ John Doe');
  console.log('  │  Email: john.doe@example.com | Password: Demo123!');
  console.log('  │  Role: USER | Status: Active');
  console.log('  │');
  console.log('  └─ Jane Smith');
  console.log('     Email: jane.smith@example.com | Password: Demo123!');
  console.log('     Role: USER | Status: Active\n');

  console.log('🔐 VAULT STORAGE:');
  console.log('  ┌─ John Doe (5 entries)');
  console.log('  │  ├─ Bank Account - Wells Fargo (CREDENTIAL) ⭐');
  console.log('  │  ├─ Gmail Account (CREDENTIAL)');
  console.log('  │  ├─ Visa Credit Card (CREDENTIAL) ⭐');
  console.log('  │  ├─ GitHub Developer Account (CREDENTIAL)');
  console.log('  │  └─ Passport Information (DOCUMENT)');
  console.log('  │');
  console.log('  └─ Jane Smith (2 entries)');
  console.log('     ├─ Investment Trading Account (CREDENTIAL) ⭐');
  console.log('     └─ Health Insurance Portal (CREDENTIAL)\n');

  console.log('🚀 THIRD-PARTY APPLICATIONS:');
  console.log('  ├─ ShopNow (Status: ACTIVE)');
  console.log('  │  Description: E-commerce shopping platform');
  console.log('  │');
  console.log('  ├─ DeliverIt (Status: ACTIVE)');
  console.log('  │  Description: Food and package delivery service');
  console.log('  │');
  console.log('  ├─ SocialHub (Status: ACTIVE)');
  console.log('  │  Description: Social networking platform');
  console.log('  │');
  console.log('  └─ BankApp (Status: BLOCKED)');
  console.log('     Description: Mobile banking application\n');

  console.log('🔑 ACCESS TOKENS & PERMISSIONS:');
  console.log('  ├─ John → ShopNow: [email, phone, address, name] (expires in 90 days)');
  console.log('  ├─ John → DeliverIt: [phone, address, name] (expires in 60 days)');
  console.log('  ├─ John → SocialHub: [email, name] (expires in 30 days)');
  console.log('  └─ Jane → DeliverIt: [email, phone, address, name] (expires in 45 days)\n');

  console.log('📋 CONSENT REQUESTS:');
  console.log('  ├─ ShopNow - APPROVED (3 apps can access user data)');
  console.log('  ├─ DeliverIt - APPROVED (2 users granted access)');
  console.log('  ├─ SocialHub - APPROVED (social profile access)');
  console.log('  └─ ShopNow (Jane) - REJECTED (user declined access)\n');

  console.log('📊 AUDIT LOGS:');
  console.log('  ├─ 2 Login events (web & mobile)');
  console.log('  ├─ 2 Vault operations (create, update)');
  console.log('  ├─ 2 Consent actions (approved & denied)');
  console.log('  ├─ 1 Token access event (data retrieval)');
  console.log('  └─ 1 Admin action (user profile view)\n');

  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('✨ Database is now ready for demonstration!');
  console.log('🎓 You can login with any demo account and explore all features');
  console.log('═══════════════════════════════════════════════════════════════════════════');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
