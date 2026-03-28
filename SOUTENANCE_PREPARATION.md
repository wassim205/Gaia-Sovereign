# 📘 Guide Complet de Préparation à la Soutenance Fil Rouge

**Projet:** Gaia Sovereign - Personal Data Vault  
**Durée totale:** 45 min  
**Structure:** 10 min démo + 10 min code source + 15 min mise en situation + 10 min questions  
**Focus:** Code + Architecture + Compréhension  
**Langue:** Français

---

## 📑 Table des Matières
1. [L'Histoire de ton Projet](#lhistoire-de-ton-projet)
2. [Architecture Générale](#architecture-générale)
3. [Backend NestJS](#backend-nestjs)
4. [Frontend Next.js](#frontend-nextjs)
5. [Tests](#tests)
6. [Mise en Situation](#mise-en-situation)
7. [Culture Web - Questions Probables](#culture-web--questions-probables)

---

## 🎯 L'Histoire de ton Projet

### Le Problème
Les utilisateurs n'ont pas le contrôle sur qui accède à leurs données personnelles sur les plateformes centralisées. Les applications tiers reçoivent souvent accès à toutes les données sans consentement granulaire.

### Ta Solution: Gaia Sovereign
Une **Personal Data Vault décentralisée** où:
- **L'utilisateur** stocke et contrôle ses données
- **Les apps tiers** doivent demander un consentement spécifique
- **L'accès** est accordé pour des champs spécifiques seulement
- **Les tokens** sont limités en temps et révocables
- **Chaque accès** est enregistré dans un audit log

### Ce que tu as implémenté

| Couche | Technologie | Fonction |
|--------|------------|----------|
| **Frontend** | Next.js (App Router) | Interface utilisateur, écran de consentement, portail développeur |
| **Backend** | NestJS | API REST sécurisée avec authentification JWT |
| **Base de données** | PostgreSQL + Prisma | Persistance des utilisateurs, tokens, consent, audit logs |
| **Sécurité** | JWT + Guards + Middleware | Authentification, validation, rate limiting, CSRF |
| **Monitoring** | Audit Logs | Traçabilité complète de chaque action |

### Le Flot Principal (Consentement)

```
1. Développeur créé une app → obtient clientId/clientSecret
2. App appelle POST /api/consent/request (avec clientId, secret, redirectUri, champs demandés)
3. Backend valide les credentials et crée une ConsentRequest
4. Frontend affiche /consent?id=XXX à l'utilisateur
5. L'utilisateur voit l'app et les champs demandés
6. Utilisateur approuve/rejette → Backend génère un AccessToken signé (JWT)
7. Backend redirige l'app avec le token
8. L'app utilise le token pour lire les champs spécifiques du vault
9. Si révocation → token invalidé immédiatement en DB
```

---

## 🏗️ Architecture Générale

### Structure du Répo

```
Gaia Sovereign/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts              # Point d'entrée + configuration globale
│   │   │   ├── app.module.ts        # Root module + middleware
│   │   │   ├── auth/                # Authentification (JWT, Guards)
│   │   │   ├── consent/             # Flot de consentement
│   │   │   ├── tokens/              # Génération et validation tokens
│   │   │   ├── vault/               # Données personnelles utilisateur
│   │   │   ├── third-party-apps/    # Apps tiers enregistrées
│   │   │   ├── audit/               # Logs d'accès
│   │   │   ├── prisma/              # Service de base de données
│   │   │   └── common/              # Middleware, guards, utilitaires
│   │   └── prisma/
│   │       └── schema.prisma        # Schéma de la DB
│   │
│   └── web/                         # Frontend Next.js
│       ├── app/                     # App Router
│       │   ├── page.tsx             # Home
│       │   ├── login/
│       │   ├── register/
│       │   ├── consent/             # Écran de consentement
│       │   ├── dashboard/           # Tableau de bord utilisateur
│       │   ├── developer/           # Portail développeur
│       │   └── admin/               # Panel admin
│       ├── components/              # Composants réutilisables
│       └── lib/api.ts               # Centralisateur des appels API
│
└── CONSENT_TESTING_GUIDE.md        # Documentation du flot
```

### Schéma de la Base de Données (Prisma)

```typescript
// Modèles principaux:

User
├── id (UUID)
├── username, email, password_hash
├── role (USER | ADMIN)
├── encryptedMasterKey (clé pour chiffrer les données)
├── vaultEntries[] (relation)
├── accessTokens[] (relation)

VaultEntry
├── id (UUID)
├── userId (FK)
├── title, category, description
├── fields[] (données sensibles)
├── isFavorite

ThirdPartyApp
├── id (UUID)
├── ownerId (FK User)
├── name, description
├── clientId, secretHash (credentials OAuth2)
├── redirectUris[]
├── status (ACTIVE | BLOCKED)

ConsentRequest
├── id (UUID)
├── userId (FK)
├── appId (FK)
├── requestedFields[] (array: ['email', 'phone'])
├── status (PENDING | APPROVED | REJECTED | EXPIRED)
├── expiresAt

AccessToken
├── id (UUID)
├── userId (FK)
├── appId (FK)
├── tokenHash (SHA256 du JWT pour non-repudiation)
├── approvedFields[] (ce qui est autorisé)
├── expiresAt
├── revokedAt (NULL = actif)

AuditLog
├── id (UUID)
├── userId (FK)
├── appId (FK)
├── action (string: 'token_issued', 'token_revoked', 'vault_read')
├── resourceId (what was accessed)
├── timestamp
```

---

## 🔧 Backend NestJS

### 1. Structure NestJS (Concepts clés)

#### Module
**Qu'est-ce que c'est?** Une classe décorée `@Module()` qui groupe logiquement:
- Controllers (routes)
- Services (business logic)
- Providers (services injectables)
- Imports (dépendances d'autres modules)

**Exemple: ConsentModule**
```typescript
// apps/api/src/consent/consent.module.ts
@Module({
  imports: [TokenModule, PrismaModule],  // Dépendances
  controllers: [ConsentController],       // Routes
  providers: [ConsentService],            // Services
  exports: [ConsentService],              // Pour réutiliser dans autres modules
})
export class ConsentModule {}
```

**Pourquoi?** C'est le pattern de NestJS pour:
- Encapsuler la logique par feature
- Gérer les dépendances simplement (injection de dépendances)
- Rendre testable (tu peux mocker les imports)

#### Controller
**Qu'est-ce que c'est?** Classe décorée `@Controller('path')` qui définit les routes HTTP.

**Exemple simplifié:**
```typescript
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post('request')
  async createRequest(@Body() dto: CreateConsentRequestDto) {
    // DTO = Data Transfer Object = validation de l'entrée
    const result = await this.consentService.createConsentRequest(dto);
    return { message: 'Ok', data: result };
  }

  @UseGuards(JwtAuthGuard)  // Valide JWT avant d'exécuter
  @Post(':id/approve')
  async approveConsent(
    @Param('id') id: string,
    @Body() dto: ApproveConsentRequestDto,
    @CurrentUser() user: CurrentUserData,  // Extrait du JWT
  ) {
    return await this.consentService.approveConsent(id, user.id, dto);
  }
}
```

**Points clés:**
- `@Body()` = extrait le JSON de la requête + valide avec DTO
- `@Param()` = extrait les variables d'URL
- `@UseGuards()` = applique un middleware de sécurité
- `@CurrentUser()` = custom decorator qui extrait l'utilisateur du JWT

**Pourquoi les Controllers doivent être minces?** Ils doivent juste:
1. Valider l'entrée (DTO)
2. Appeler le service
3. Formater la réponse
Toute la logique va dans le Service.

#### Service
**Qu'est-ce que c'est?** Classe décorée `@Injectable()` qui contient la business logic.

**Exemple simplifié:**
```typescript
@Injectable()
export class ConsentService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private auditLogService: AuditLogService,
  ) {}

  async createConsentRequest(dto: CreateConsentRequestDto) {
    // 1. Valider l'app (clientId + secret)
    const app = await this.prisma.thirdPartyApp.findFirst({
      where: { clientId: dto.clientId, status: 'ACTIVE' },
    });
    if (!app) throw new NotFoundException('App not found');

    // 2. Vérifier le secret
    const isSecretValid = await this.passwordService.verifyPassword(
      app.secretHash,
      dto.clientSecret,
    );
    if (!isSecretValid) throw new UnauthorizedException('Invalid secret');

    // 3. Créer la ConsentRequest
    const consentRequest = await this.prisma.consentRequest.create({
      data: {
        userId: null,  // Sera rempli quand l'utilisateur approuve
        appId: app.id,
        requestedFields: this.normalizeFields(dto.requestedFields),
        redirectUri: dto.redirectUri,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),  // 10 min
      },
    });

    // 4. Logger en audit
    await this.auditLogService.log({
      action: 'consent_request_created',
      userId: null,
      appId: app.id,
      resourceId: consentRequest.id,
    });

    return { consentRequest, app };
  }

  async approveConsent(id: string, userId: string, dto: ApproveConsentRequestDto) {
    // 1. Récupérer la ConsentRequest
    const cr = await this.prisma.consentRequest.findUnique({ where: { id } });
    if (!cr) throw new NotFoundException('Consent request not found');
    if (cr.expiresAt < new Date()) throw new BadRequestException('Expired');

    // 2. Générer un AccessToken avec les champs approuvés
    const { token, expiresAt } = await this.tokenService.generateAccessToken({
      userId,
      appId: cr.appId,
      approvedFields: dto.approvedFields,
    });

    // 3. Marquer la ConsentRequest comme APPROVED
    await this.prisma.consentRequest.update({
      where: { id },
      data: { status: 'APPROVED', userId },
    });

    // 4. Logger
    await this.auditLogService.log({
      action: 'consent_approved',
      userId,
      appId: cr.appId,
      resourceId: id,
    });

    return {
      token,
      expiresAt,
      redirectUri: cr.redirectUri,
      state: cr.state,
    };
  }
}
```

**Pourquoi?** Separation of concerns:
- Controllers orchestrent
- Services contiennent la logique métier
- Tests unitaires testent juste le service (mock Prisma)

---

### 2. DTOs (Data Transfer Objects)

**Qu'est-ce que c'est?**  
Une classe qui décrit la **forme** et les **règles** des données entrantes (validation).

**Exemple:**
```typescript
// apps/api/src/consent/dto/create-consent-request.dto.ts
import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class CreateConsentRequestDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  requestedFields: string[];
}
```

**Pourquoi?**
```
Request JSON: {"clientId": "abc", ...}
       ↓ (ValidationPipe applique le DTO)
   ✓ Valide les types
   ✓ Rejette les champs extra (whitelist: true)
   ✓ Lance une erreur 400 si invalide
   ✓ Transforme les types (string → number)
       ↓ (Controller reçoit objet sûr)
```

**Sécurité:** Sans DTO, un utilisateur pourrait envoyer `{"admin": true}` et le bypasser accidentellement.

---

### 3. Guards + ExecutionContext (❗ Question très probable)

#### Qu'est-ce qu'un Guard?
Un Guard est un middleware NestJS qui **décide si la requête peut continuer** avant d'arriver au controller.

**Analogie:** Un agent de sécurité à l'entrée d'une discothèque:
- Vérifie le ticket (JWT)
- Vérifie que t'es pas en liste noire
- Te laisse entrer ou non

#### ExecutionContext
C'est un **abstraction NestJS** qui te donne accès à la requête actuelle. En HTTP, c'est la Request/Response.

**Exemple: JwtAuthGuard**
```typescript
// apps/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Comment ça marche sous le capot:**
```typescript
// NestJS + Passport appellent interne:
class MyCustomGuard {
  canActivate(context: ExecutionContext): boolean {
    // 1. Extrait la requête HTTP
    const request = context.switchToHttp().getRequest();

    // 2. Extrait le JWT du header Authorization
    const token = request.headers.authorization?.replace('Bearer ', '');

    // 3. Valide le token avec la stratégie JWT
    // (vérifie la signature, l'expiration)

    // 4. Si valide, attache l'user object:
    // request.user = { id, email, role, iat, exp }

    // 5. Retourne true → requête continue
    return true;
  }
}
```

**Utilisation dans un contrôleur:**
```typescript
@Post('approve')
@UseGuards(JwtAuthGuard)  // Le guard s'exécute ici
async approveConsent(
  @Param('id') id: string,
  @CurrentUser() user: CurrentUserData,  // Vient de request.user
) {
  // À ce stade on sait que:
  // - Le JWT est valide
  // - L'utilisateur existe et est authentifié
}
```

**Custom Guard (exemple: TokenValidationGuard)**
```typescript
// apps/api/src/tokens/token-validation.guard.ts
@Injectable()
export class TokenValidationGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extrait le token de scope
    const token = request.headers['x-access-token'];
    if (!token) throw new UnauthorizedException('No token');

    // Valide le token (signature + DB check)
    const payload = await this.tokenService.validateToken(token);
    
    // Attache les infos au request pour utilisation downstream
    request.tokenContext = payload;
    
    return true;
  }
}
```

**Points clés à retenir:**
- Guard = middleware de sécurité/validation
- ExecutionContext = objet qui représente la requête
- `context.switchToHttp().getRequest()` = accès à l'objet Express Request
- Si canActivate() retourne true → route continue
- Si lance une exception → erreur 401/403

---

### 4. Authentification JWT (JWT Strategy + Guards)

#### Le Flot JWT

```
1. Utilisateur envoie POST /api/auth/login { email, password }
        ↓
2. AuthService valide email/password
        ↓
3. Si valide → génère JWT signé:
   {
     sub: userId,
     email: user.email,
     role: user.role,
     iat: <timestamp>,
     exp: <timestamp + 1h>
   }
   Signature: HMAC(header.payload, SECRET_KEY)
        ↓
4. JWT retourné au client (localStorage)
        ↓
5. Client envoie: GET /api/vault
   Header: Authorization: Bearer <JWT>
        ↓
6. JwtAuthGuard décode + valide la signature
        ↓
7. Si valide → request.user = { sub, email, role, ... }
        ↓
8. Controller reçoit l'utilisateur via @CurrentUser()
```

**Fichiers clés:**
- `apps/api/src/auth/strategies/jwt.strategy.ts` - Logique de validation
- `apps/api/src/auth/guards/jwt-auth.guard.ts` - Applique la stratégie
- `apps/api/src/auth/auth.service.ts` - Génère le JWT

---

### 5. Prisma CRUD Patterns (Syntaxe à retenir)

Voici les **100 patterns** que tu dois connaître. Tu les utilises dans tes services.

#### Récupérer UN enregistrement
```typescript
// Par ID unique
const user = await this.prisma.user.findUnique({
  where: { id: '123' },
});

// Premier qui match une condition
const user = await this.prisma.user.findFirst({
  where: { email: 'user@example.com' },
});

// Avec des champs spécifiques (performance)
const user = await this.prisma.user.findUnique({
  where: { id: '123' },
  select: {
    id: true,
    email: true,
    // password_hash: false (exclu)
  },
});

// Avec relations imbriquées
const user = await this.prisma.user.findUnique({
  where: { id: '123' },
  include: {
    vaultEntries: true,  // Include tous les vaults
  },
});

// Include avec filtering
const user = await this.prisma.user.findUnique({
  where: { id: '123' },
  include: {
    vaultEntries: {
      where: { category: 'PROFILE' },
      select: { id: true, title: true },
    },
  },
});
```

#### Récupérer PLUSIEURS enregistrements
```typescript
// Tous
const users = await this.prisma.user.findMany();

// Avec filtre
const users = await this.prisma.user.findMany({
  where: { role: 'ADMIN' },
});

// Filtre complexe
const users = await this.prisma.user.findMany({
  where: {
    AND: [
      { role: 'USER' },
      { createdAt: { gte: new Date('2025-01-01') } },  // >=
    ],
  },
});

// Avec tri
const users = await this.prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
});

// Pagination
const users = await this.prisma.user.findMany({
  skip: 0,          // Offset
  take: 10,         // Limit
  orderBy: { createdAt: 'desc' },
});

// Avec relations
const users = await this.prisma.user.findMany({
  include: { vaultEntries: true },
});
```

#### CRÉER
```typescript
// Simple
const user = await this.prisma.user.create({
  data: {
    username: 'john',
    email: 'john@example.com',
    password: 'hashed_password',
  },
});

// Avec relation
const vault = await this.prisma.vaultEntry.create({
  data: {
    title: 'My Secret',
    userId: 'user-id',  // FK
    category: 'PROFILE',
  },
});

// Retourner des champs spécifiques
const user = await this.prisma.user.create({
  data: { ... },
  select: { id: true, email: true },
});
```

#### METTRE À JOUR
```typescript
// Simple
const user = await this.prisma.user.update({
  where: { id: '123' },
  data: { email: 'new@example.com' },
});

// Avec increment (counters)
const token = await this.prisma.accessToken.update({
  where: { id: 'token-id' },
  data: {
    usageCount: { increment: 1 },
  },
});

// Mettre à jour ou créer si n'existe pas
const config = await this.prisma.config.upsert({
  where: { key: 'FEATURE_FLAG' },
  update: { value: 'true' },
  create: { key: 'FEATURE_FLAG', value: 'true' },
});
```

#### SUPPRIMER
```typescript
// Un enregistrement
await this.prisma.user.delete({
  where: { id: '123' },
});

// Plusieurs (careful!)
await this.prisma.user.deleteMany({
  where: { role: 'INACTIVE' },
});
```

#### Opérateurs de Filtre Prisma
```typescript
const users = await this.prisma.user.findMany({
  where: {
    // Comparaison
    age: { gt: 18 },           // >
    age: { gte: 18 },          // >=
    age: { lt: 65 },           // <
    age: { lte: 65 },          // <=
    age: { equals: 25 },       // ==

    // String
    email: { contains: 'gmail' },
    email: { startsWith: 'admin' },
    email: { mode: 'insensitive' },  // Case insensitive

    // Array
    tags: { hasSome: ['urgent'] },

    // Date
    createdAt: { gte: new Date('2025-01-01') },

    // Null check
    deletedAt: null,
  },
});
```

---

### 6. Prisma Service (Connexion à la DB)

**Qu'est-ce que c'est?**
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();  // Connexion à la DB au démarrage
  }

  async onModuleDestroy() {
    await this.$disconnect();  // Déconnexion à l'arrêt
  }
}
```

**Comment l'utiliser?**
```typescript
@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}  // Injecter

  async someMethod() {
    const user = await this.prisma.user.findUnique(...);  // Utiliser
  }
}
```

**Pourquoi?** NestJS gère le cycle de vie de la connexion automatiquement.

---

### 7. Token Service (Génération + Validation JWT)

C'est un concept avancé et **très probable en soutenance**.

**Ce que tu as implémenté:**

```typescript
// apps/api/src/tokens/token.service.ts
@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,  // Signe le JWT
    private prisma: PrismaService,
  ) {}

  async generateAccessToken(options: {
    userId: string;
    appId: string;
    approvedFields: string[];
    ttlMinutes?: number;
  }): Promise<{ token: string; expiresAt: Date }> {
    const ttlMinutes = options.ttlMinutes || 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Payload du JWT
    const payload = {
      sub: options.userId,           // Subject = user ID
      app_id: options.appId,
      approved_fields: options.approvedFields,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // 1. Signer le JWT
    const token = this.jwtService.sign(payload);

    // 2. Stocker le SHA256(token) en DB (pour révocation + audit)
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await this.prisma.accessToken.create({
      data: {
        userId: options.userId,
        appId: options.appId,
        tokenHash,           // On stocke le hash, pas le token en clair
        approvedFields: options.approvedFields,
        expiresAt,
        revokedAt: null,
      },
    });

    return { token, expiresAt };
  }

  async validateToken(token: string): Promise<AccessTokenPayload> {
    // 1. Vérifier la signature + expiration JWT
    const payload = this.jwtService.verify(token);

    // 2. Vérifier en DB que le token n'a pas été révoqué
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const tokenRecord = await this.prisma.accessToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,  // N'est pas révoqué
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Token revoked or invalid');
    }

    return payload;
  }

  async revokeToken(token: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await this.prisma.accessToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
```

**Pourquoi cette approche (JWT + DB)?**
- ✅ **JWT:** portable, pas besoin de query DB à chaque fois
- ✅ **DB:** permet révocation immédiate (sans attendre l'expiration)
- ✅ **Hash:** on stocke pas le token en clair (sécurité)

**Analogie:** C'est comme un ticket de concert:
- Ticket = JWT (contient ton nom, la date, la signature du venue)
- Base de données = registre à l'entrée (vérifie que tu es pas déjà rentré)

---

### 8. Validation Globale + Main.ts

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CORS: Autoriser les requêtes du frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'https://gaia.example.com'],
    credentials: true,
  });

  // 2. Helmet: Headers de sécurité
  app.use(helmet());

  // 3. Global Validation Pipe: valide tous les DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Rejette champs inconnus
      forbidNonWhitelisted: true,   // Lance erreur si champs extra
      transform: true,              // Convertit types (string → number)
    }),
  );

  await app.listen(4000);
}
```

**Pourquoi?** Sécurité + consistence API.

---

## 🎨 Frontend Next.js

### 1. Architecture Next.js (App Router)

Tu utilises le **App Router** (nouvelle approche, depuis Next 13+).

```
apps/web/app/
├── page.tsx              # / (home)
├── layout.tsx            # Layout partagé (navbar, etc)
├── globals.css           # Styles globaux
├── login/
│   └── page.tsx          # /login
├── register/
│   └── page.tsx          # /register
├── consent/
│   └── page.tsx          # /consent?id=XXX (affiche l'écran de consentement)
├── dashboard/
│   └── page.tsx          # /dashboard (protégé, affiche le vault)
├── developer/
│   └── page.tsx          # /developer (portail pour créer des apps)
└── admin/
    └── page.tsx          # /admin (panel admin)
```

**Différence Page Router vs App Router:**

| Page Router | App Router |
|------------|-----------|
| `pages/login.tsx` | `app/login/page.tsx` |
| `pages/api/users.ts` | `app/api/users/route.ts` |
| Pas de Server Components | Server Components par défaut |
| `getServerSideProps` | Fetch en direct dans le composant |

**Tu utilises App Router** → plus moderne, meilleure performance.

---

### 2. Patterns Frontend (Hooks + Fetch)

#### Client Component avec useEffect (Fetcher les données)

```typescript
// apps/web/app/consent/page.tsx
'use client';  // ← Important! Marque comme Client Component

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface ConsentRequest {
  id: string;
  app: { name: string; clientId: string };
  requestedFields: string[];
}

export default function ConsentPage() {
  const searchParams = useSearchParams();
  const consentId = searchParams.get('id');

  // State
  const [consent, setConsent] = useState<ConsentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  // Fetch
  useEffect(() => {
    const fetchConsent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        const res = await fetch(
          `http://api/consent/${consentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setConsent(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (consentId) fetchConsent();
  }, [consentId]);

  const handleApprove = async () => {
    try {
      setApproving(true);
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`http://api/consent/${consentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approvedFields: consent?.requestedFields || [],
        }),
      });

      if (!res.ok) throw new Error('Failed to approve');
      const data = await res.json();
      
      // Redirection vers l'app avec le token
      window.location.href = `${data.data.redirectUri}?token=${data.data.token}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!consent) return <div>Pas de consentement trouvé</div>;

  return (
    <div className="p-8">
      <h1>Permission demandée</h1>
      <p>L'app <strong>{consent.app.name}</strong> demande accès à:</p>
      <ul>
        {consent.requestedFields.map(field => (
          <li key={field}>{field}</li>
        ))}
      </ul>
      <button onClick={handleApprove} disabled={approving}>
        {approving ? 'Approbation...' : 'Approuver'}
      </button>
    </div>
  );
}
```

**Points clés:**
- `'use client'` en haut = composant client (peut utiliser useState, useEffect)
- `useEffect` s'exécute après le rendu
- État de chargement/erreur pour UX
- Token stocké en localStorage
- Headers d'authentification

---

#### API Service Centralisé (Évite la duplication)

```typescript
// apps/web/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Helper pour fetch avec gestion d'erreur
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('accessToken')
    : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}

// Endpoints spécifiques (réutilisables)
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: (username: string, email: string, password: string) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
};

export const consentAPI = {
  getConsent: (id: string) => apiCall(`/consent/${id}`),
  
  approveConsent: (id: string, approvedFields: string[]) =>
    apiCall(`/consent/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedFields }),
    }),
};

// Usage dans les composants
// const data = await consentAPI.getConsent('id');
```

**Avantages:**
- Centralisé = évite duplication
- Gestion d'erreur uniforme
- Headers d'auth automatiques
- Facile à tester

---

### 3. Context + Providers (State Global)

Même si tu n'utilises pas Redux, tu dois comprendre Comment partager un state global.

#### Pattern React Context

```typescript
// app/providers/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Fetch user profile
      fetch('http://api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUser(data.user))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('http://api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Usage:**
```typescript
// app/layout.tsx
export default function Layout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

// Any component
function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

**Quand l'utiliser?**
- ✅ État partagé entre plusieurs composants (auth, theme, language)
- ❌ Data globale complexe avec beaucoup de mutations → Redux/Zustand

---

### 4. Composant Réutilisable (Button avec props)

C'est très probable en mise en situation.

```typescript
// components/ui/Button.tsx
import React from 'react';

interface ButtonProps {
  text: string;
  color?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Button({
  text,
  color = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  size = 'medium',
  className = '',
}: ButtonProps) {
  // Classes selon la couleur
  const colorClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-black',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  // Classes selon la taille
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded font-semibold transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {text}
    </button>
  );
}
```

**Usage:**
```typescript
<Button text="Envoyer" color="primary" size="large" onClick={handleSubmit} />
<Button text="Annuler" color="secondary" />
<Button text="Supprimer" color="danger" type="submit" />
```

**Points clés:**
- Props bien typées (TypeScript)
- Props optionnels avec valeurs par défaut
- Classes Tailwind conditionnelles
- Styling cohérent

---

## 🧪 Tests

### 1. Concepts (Unit vs Integration vs E2E)

#### Unit Test
**Qu'est-ce que c'est?** Test d'une fonction/classe **isolée**, sans dépendances réelles.

```typescript
// Token.service.spec.ts (Unit Test)
describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtServiceMock: Partial<JwtService>;
  let prismaMock: Partial<PrismaService>;

  beforeEach(() => {
    // Mocks: remplacent les vraies dépendances
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('fake-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
    };

    prismaMock = {
      accessToken: {
        create: jest.fn().mockResolvedValue({ id: 'token-1' }),
      },
    };

    // Injecter les mocks
    tokenService = new TokenService(
      jwtServiceMock as JwtService,
      prismaMock as PrismaService,
    );
  });

  it('should generate a token with correct payload', async () => {
    const result = await tokenService.generateAccessToken({
      userId: 'user-1',
      appId: 'app-1',
      approvedFields: ['email'],
    });

    expect(result.token).toBe('fake-token');
    expect(jwtServiceMock.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        app_id: 'app-1',
      })
    );
  });
});
```

**Pourquoi?**
- Rapide (pas de DB réelle)
- Isolé (teste juste la logique)
- Facile à déboguer

#### Integration Test
**Qu'est-ce que c'est?** Test de plusieurs composants ensemble (Service + DB réelle, ou Controller + Service).

```typescript
// Consent.service.spec.ts (Integration Test)
describe('ConsentService (Integration)', () => {
  let consentService: ConsentService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConsentService, PrismaService],
    }).compile();

    consentService = module.get<ConsentService>(ConsentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create consent request and approve it', async () => {
    // 1. Crée un utilisateur réel en DB
    const user = await prisma.user.create({
      data: { username: 'john', email: 'john@test.com', password: 'hashed' },
    });

    // 2. Crée une app
    const app = await prisma.thirdPartyApp.create({
      data: {
        ownerId: user.id,
        name: 'My App',
        clientId: 'client-123',
        secretHash: 'hashed-secret',
      },
    });

    // 3. Teste le service avec vraies données
    const result = await consentService.createConsentRequest({
      clientId: 'client-123',
      clientSecret: 'secret',
      redirectUri: 'http://app.local/callback',
      requestedFields: ['email', 'phone'],
    });

    expect(result.consentRequest).toBeDefined();
    expect(result.app.id).toBe(app.id);
  });
});
```

**Pourquoi?**
- Teste les vraies interactions
- Détecte bugs d'intégration
- Plus lent que unit test

#### E2E Test
**Qu'est-ce que c'est?** Test de toute l'app comme un utilisateur réel (HTTP requêtes).

```typescript
// test/consent.e2e-spec.ts
describe('Consent Flow (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should complete the consent flow', async () => {
    // 1. Register utilisateur
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'john',
        email: 'john@test.com',
        password: 'Password123!',
      })
      .expect(201);

    const { accessToken } = registerRes.body.data;

    // 2. Create consent request
    const consentRes = await request(app.getHttpServer())
      .post('/consent/request')
      .send({
        clientId: 'test-app',
        clientSecret: 'test-secret',
        redirectUri: 'http://app.local/callback',
        requestedFields: ['email'],
      })
      .expect(201);

    const consentId = consentRes.body.data.consentRequest.id;

    // 3. Approuver le consentement
    const approveRes = await request(app.getHttpServer())
      .post(`/consent/${consentId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ approvedFields: ['email'] })
      .expect(200);

    expect(approveRes.body.data.token).toBeDefined();
  });
});
```

**Pourquoi?**
- Teste le flow complet utilisateur
- Détecte erreurs de routing, auth, etc.
- Plus lent (démarre toute l'app)

#### Mock
**Qu'est-ce que c'est?** Un objet "fake" qui remplace une dépendance réelle.

```typescript
// Mock simple
const jwtServiceMock = {
  sign: jest.fn().mockReturnValue('fake-token'),  // Quand appelé, retourne "fake-token"
};

// Mock avec différentes valeurs
const prismaMock = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
  },
};

// Vérifier que la fonction a été appelée
expect(jwtServiceMock.sign).toHaveBeenCalled();
expect(jwtServiceMock.sign).toHaveBeenCalledWith(payload);
```

**Pourquoi?**
- Isole la fonction testée
- Évite les I/O réels
- Rapide et prévisible

---

### 2. Commandes de Test

```bash
# Unit tests
pnpm --filter api test

# Unit tests en watch mode
pnpm --filter api test:watch

# Coverage
pnpm --filter api test:cov

# E2E tests
pnpm --filter api test:e2e
```

**Fichiers de test dans ton repo:**
- Unit tests: `src/**/*.spec.ts` (même dossier que la logique)
- E2E tests: `test/*.e2e-spec.ts` (dossier séparé)

---

### 3. Structure Standard d'un Test

```typescript
// Service à tester
describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: PrismaService;

  // Setup: avant chaque test
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ConsentService, PrismaService],
    }).compile();

    service = module.get(ConsentService);
    prisma = module.get(PrismaService);
  });

  // Cleanup: après chaque test
  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // Test 1
  describe('createConsentRequest', () => {
    it('should create a consent request', async () => {
      // Arrange: préparer les données
      const input = { /* ... */ };

      // Act: exécuter la logique
      const result = await service.createConsentRequest(input);

      // Assert: vérifier le résultat
      expect(result).toBeDefined();
      expect(result.id).toMatch(/\w+-\w+/);  // UUID format
    });

    it('should throw if app not found', async () => {
      // Arrange
      const input = { clientId: 'unknown' };

      // Act & Assert
      await expect(service.createConsentRequest(input))
        .rejects.toThrow('App not found');
    });
  });
});
```

---

## 🎭 Mise en Situation

C'est **15 minutes** où on te donne un cahier des charges et tu dois **coder**.

### Scénario 1: Afficher une liste d'utilisateurs (React + Fetch)

**Cahier des charges:**
```
- Créer une page React qui affiche une liste d'utilisateurs
- Fetch depuis une API publique: https://jsonplaceholder.typicode.com/users
- Afficher: nom, email, téléphone
- Ajouter un champ search: filtrer par nom (client-side)
- Ajouter un loading spinner pendant le fetch
```

**Solution:**
```typescript
'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  // Filtrer les utilisateurs
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1>Utilisateurs</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Chercher par nom..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border p-2 mb-4"
      />

      {/* Loading */}
      {loading && <p>Chargement...</p>}

      {/* List */}
      <ul>
        {filtered.map(user => (
          <li key={user.id} className="border-b p-4">
            <strong>{user.name}</strong> ({user.email})
            <br />
            Tél: {user.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Points évalués:**
- ✅ useEffect pour fetch
- ✅ Gestion d'état (loading, data, search)
- ✅ Filter/map correct
- ✅ Affichage des données
- ✅ Key prop sur les listes

---

### Scénario 2: Composant Button Réutilisable

**Cahier des charges:**
```
Créer un composant Button réutilisable avec:
- Paramètre "text" (texte du bouton)
- Paramètre "color" (primary, secondary, danger)
- Paramètre "onClick" (callback)
- Paramètre "disabled" (état désactivé)
Ajouter une classe tailwind pour les styles
Afficher "Envoyer", "Annuler", "Supprimer" avec couleurs différentes
```

**Solution:**
```typescript
// components/Button.tsx
interface ButtonProps {
  text: string;
  color?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ text, color = 'primary', onClick, disabled }: ButtonProps) {
  const colorMap = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-400 hover:bg-gray-500',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded text-white font-bold
        transition disabled:opacity-50
        ${colorMap[color]}
      `}
    >
      {text}
    </button>
  );
}

// Usage
export default function App() {
  return (
    <div className="flex gap-4">
      <Button text="Envoyer" color="primary" />
      <Button text="Annuler" color="secondary" />
      <Button text="Supprimer" color="danger" onClick={() => alert('Deleted')} />
      <Button text="Disabled" disabled />
    </div>
  );
}
```

---

### Scénario 3: CRUD Simple (Ajouter/Supprimer)

**Cahier des charges:**
```
Créer une TODO list:
- Afficher une liste de TODOs
- Ajouter une TODO via un input + bouton
- Supprimer une TODO
- État doit persister en localStorage
```

**Solution:**
```typescript
'use client';

import { useState, useEffect } from 'react';

interface Todo {
  id: string;
  text: string;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('todos');
    if (stored) setTodos(JSON.parse(stored));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: input }]);
    setInput('');
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div className="p-8 max-w-md">
      <h1>Mes TODOs</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && addTodo()}
          placeholder="Nouvelle TODO..."
          className="border flex-1 p-2"
        />
        <button onClick={addTodo} className="bg-blue-600 text-white px-4 py-2 rounded">
          Ajouter
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex justify-between items-center border p-2 rounded">
            <span>{todo.text}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="bg-red-600 text-white px-2 py-1 rounded text-sm"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 💡 Culture Web - Questions Probables

### 1. REST API & HTTP

**Q: Qu'est-ce qu'une API REST?**  
R: Architecture pour construire des APIs web:
- **R**epresentational **S**tate **T**ransfer
- Utilise les méthodes HTTP: GET (lire), POST (créer), PUT/PATCH (modifier), DELETE (supprimer)
- Chaque route représente une **ressource** (users, posts, etc)

**Exemple:**
```
GET    /api/users         → Lister tous
GET    /api/users/123     → Un seul
POST   /api/users         → Créer
PUT    /api/users/123     → Remplacer
PATCH  /api/users/123     → Modifier partiellement
DELETE /api/users/123     → Supprimer
```

**Q: Codes HTTP à connaître?**
```
200 OK               → Succès
201 Created          → Ressource créée
400 Bad Request      → Données invalides
401 Unauthorized     → Pas authentifié
403 Forbidden        → Pas de permission
404 Not Found        → Resource inexistante
500 Server Error     → Erreur backend
```

---

### 2. JWT (JSON Web Token)

**Q: Qu'est-ce qu'un JWT?**  
R: Un token signé contenant des infos encodées.

**Structure:**
```
Header.Payload.Signature

Header:     { alg: 'HS256', typ: 'JWT' }
Payload:    { sub: 'user-1', email: 'test@test.com', iat: 1234567, exp: 1234670 }
Signature:  HMAC(header.payload, SECRET)
```

**Q: Difference JWT vs Cookie?**

| JWT | Cookie |
|-----|--------|
| Envoyé dans Authorization header | Envoyé automatiquement par le browser |
| Stateless (token contient les infos) | Stateful (serveur stocke la session) |
| Bon pour APIs | Bon pour websites traditionnels |

---

### 3. Sécurité Web

**Q: XSS (Cross-Site Scripting)?**  
R: Une attaque où un utilisateur injecte du code malveillant dans le DOM.

```javascript
// ❌ MAUVAIS: innerHTML peut exécuter du code
element.innerHTML = userInput;  // Si userInput = '<img src=x onerror="alert()">'

// ✅ BON: textContent ne rend que du texte
element.textContent = userInput;

// ✅ React échappe automatiquement
<div>{userInput}</div>  // Safe
```

**Q: CSRF (Cross-Site Request Forgery)?**  
R: Une attaque où un site malveillant envoie une requête pour compte d'un utilisateur légitime.

```
Mitigation:
- Token CSRF dans les formulaires
- Vérifier Referer header
- SameSite cookies
```

**Q: SQL Injection?**  
R: Injecter du code SQL malveillant dans une requête.

```sql
-- ❌ MAUVAIS
SELECT * FROM users WHERE email = '" + userInput + "'
-- Si userInput = "' OR '1'='1", la requête devient:
SELECT * FROM users WHERE email = '' OR '1'='1'  -- Retourne TOUS les users!

-- ✅ BON: Requête préparée (Prisma, ORM)
prisma.user.findFirst({ where: { email: userInput } })
-- Le userInput est traité comme une donnée, pas du code
```

---

### 4. CORS (Cross-Origin Resource Sharing)

**Q: Qu'est-ce que CORS?**  
R: Mécanisme de sécurité qui contrôle quels sites peuvent accéder à ton API.

```
1. Frontend: http://localhost:3000
2. Backend: http://localhost:4000
3. Frontend fait une requête au backend
4. Backend vérifie l'Origin header
5. Si autorisé → envoie Access-Control-Allow-Origin
6. Browser laisse passer la réponse
```

**Exemple NestJS:**
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'https://myapp.com'],
  credentials: true,  // Permettre les cookies
});
```

---

### 5. Architecture (Backend + Frontend)

**Q: Monolithic vs Microservices?**

| Monolithic | Microservices |
|-----------|---------|
| Tout dans une seule app | Chaque feature est un service séparé |
| Simple mais difficile à scaler | Scalable mais complexe |
| Ton projet (Gaia): Monolithic (une API NestJS) | Netflix, Uber: Microservices |

**Q: Client-Side vs Server-Side Rendering?**

| CSR (Client-Side) | SSR (Server-Side) |
|----|---|
| HTML vide, JS render | HTML complète dès le départ |
| Next.js App Router: CSR par défaut | Next.js avec `getServerSideProps`: SSR |
| Bon pour SPAs, dashboards | Bon pour SEO, pages statiques |

---

### 6. Validation + Error Handling

**Q: Pourquoi valider les entrées?**  
R: Sécurité + UX

```typescript
// ❌ MAUVAIS
app.post('/users', (req, res) => {
  const user = new User(req.body);  // Peut créer avec n'importe quoi
  user.save();
});

// ✅ BON
app.post('/users', (req, res) => {
  const createUserDto = new CreateUserDto(req.body);  // DTO valide
  if (!createUserDto.isValid()) return res.status(400).send('Invalid');
  const user = new User(createUserDto);
  user.save();
});
```

**Q: Types d'erreur à gérer?**
```
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)
- Unexpected errors (log + 500)
```

---

### 7. Performance

**Q: Lazy Loading?**  
R: Charger le code/données seulement quand nécessaire.

```typescript
// React
const ConsentPage = lazy(() => import('./ConsentPage'));

// Prisma
const user = await prisma.user.findUnique({
  select: { id: true, email: true },  // Seulement ces champs
});
```

**Q: Caching?**  
R: Stocker des résultats pour éviter recalculs.

```
HTTP Cache-Control: max-age=3600  // Cache 1h
Redis/Memcached                    // Cache en mémoire
Prisma select                      // Charger moins de données
```

---

### 8. DRY / SRP / SOLID

**Q: DRY (Don't Repeat Yourself)?**  
R: Éviter duplication. Créer des fonctions réutilisables.

```typescript
// ❌ MAUVAIS: duplication
post('/users', (req, res) => {
  if (!req.body.email) return res.status(400).send('Email required');
  if (!req.body.password) return res.status(400).send('Password required');
});

post('/posts', (req, res) => {
  if (!req.body.title) return res.status(400).send('Title required');
  if (!req.body.content) return res.status(400).send('Content required');
});

// ✅ BON: réutilisable avec DTOs
// Validation centralisée
```

**Q: SRP (Single Responsibility Principle)?**  
R: Une fonction/classe = un seul objectif.

```typescript
// ❌ MAUVAIS: Controller fait trop
@Post('users')
async createUser(@Body() dto: CreateUserDto) {
  // Valide
  // Accès DB
  // Log
  // Email notification
  // ...
}

// ✅ BON: Chaque couche fait son truc
Controller       → Valide + Appelle Service
Service          → Business logic + Appelle Prisma + Appelle EmailService
PrismaService    → DB queries
EmailService     → Emails
```

---

## 📝 Checklist Pré-Soutenance

### Avant le jour J

- [ ] **Comprendre le flot métier** (utilisateur approuve consentement → token généré → data accessible)
- [ ] **Connaître NestJS structure** (Module, Controller, Service, Provider)
- [ ] **Prisma CRUD** (findUnique, findMany, create, update, delete)
- [ ] **JWT + Guards** (Comment ExecutionContext marche)
- [ ] **Tests** (Savoir décrire unit vs integration vs e2e)
- [ ] **React Hooks** (useEffect, useState)
- [ ] **API Fetch** (Gestion d'erreur, loading state)
- [ ] **Context API** (Quand l'utiliser)
- [ ] **Composant réutilisable** (Props bien typées)
- [ ] **Culture web** (REST, HTTP codes, CORS, JWT, XSS, CSRF, etc.)

### Pour la démo (10 min)

1. **Montrer le frontend rapidement:**
   - Page login
   - Page consent (approuver/rejeter)
   - Dashboard vault
   
2. **Montrer le code backend:**
   - app.module.ts (structure)
   - consent.service.ts (business logic)
   - Un test

### Pour la mise en situation (15 min)

Tu vas probablement recevoir:
- Fetcher une API + afficher liste + filtrer
- Créer un composant Button réutilisable
- Ajouter/Supprimer des items (CRUD simple)

**Conseils:**
- Prends 2 min pour lire le cahier des charges
- Code proprement (indentation, noms clairs)
- Teste en même temps
- Explique tes choix (pourquoi Context, pourquoi useEffect, etc.)

### Pour les questions (10 min)

Prépare des answers courtes et claires sur:
- Ton architecture
- Pourquoi tu as choisi NestJS + Next.js
- La différence entre unit/integration/e2e tests
- Ce qu'est un DTO et un Guard
- Comment marche l'authentification JWT

---

## 🎬 Exemple de Réponse à une Question Soutenance

**Q: Explique-moi comment fonctionne le flot de consentement dans ton appli?**

**R:**
> "Bien sûr. Voici le flot complet:
>
> 1. Une app tiers (comme Google) veut accéder aux données d'un utilisateur
> 2. L'app envoie une requête: `POST /api/consent/request` avec son clientId, secret, et les champs qu'elle demande (email, phone, etc)
> 3. Mon backend vérifie que l'app existe et que le secret est valide
> 4. Je crée une ConsentRequest en DB avec le status PENDING et une expiration (10 minutes)
> 5. L'app redirige l'utilisateur vers ma page `/consent?id=XXX`
> 6. L'utilisateur voit l'app qui demande et les champs spécifiques
> 7. L'utilisateur clique 'Approuver'
> 8. Mon backend génère un JWT signé qui contient l'ID de l'utilisateur, l'app, et les champs approuvés
> 9. Je stocke aussi le hash du token en DB pour pouvoir le révoquer plus tard (c'est important pour la sécurité)
> 10. Je redirige l'utilisateur + l'app avec le token
> 11. L'app utilise ce token pour lire les champs spécifiques du vault de l'utilisateur
> 12. Chaque accès est enregistré en audit log
> 13. L'utilisateur peut révoquer le token à tout moment, et le token devient invalide immédiatement"

---

**Bonne chance pour ta soutenance! Tu as un super projet! 🚀**

