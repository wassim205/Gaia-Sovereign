**Projet : Personal Data Vault — "You Own Your Data"**

**Auteur / Étudiant :** El Mourabit Wassim

**Filière :** YouCode — Projet de fin d’études (fil‑rouge)

---

## Documentation / Onboarding

- **Architecture & décisions sécurité (résumé + liens)**: voir la section "Architecture & sécurité" ci-dessous
- **Security Decision Log (SDL)**: `docs/SECURITY_DECISION_LOG.md`
- **User Guide (Consent flow + Developer Portal)**: `docs/USER_GUIDE.md`
- **Consent Flow Testing Guide**: `CONSENT_TESTING_GUIDE.md`
- **Database schema (high level)**: `DATABASE_SCHEMA.md`

---

## Architecture & sécurité (résumé)

### Architecture (haut niveau)

- **Web app** (Next.js): interface utilisateur (Vault, Consent screen, Developer Portal)
- **API** (NestJS): auth, vault, consent, tokens, audit logs
- **Database** (PostgreSQL via Prisma): persistance des utilisateurs, apps tierces, consents, tokens, logs

### Décisions sécurité (pour le "pourquoi", voir le SDL)

- **Chiffrement au repos (field-level)**: chiffrement des valeurs de la vault par champ (AES-256-GCM) afin d’aligner le modèle de sécurité avec le consentement par scope/champ.
- **Jetons d’accès 3rd-party**: jeton **JWT signé** présenté par les apps, avec **hash stocké en DB** pour permettre révocation immédiate et contrôle serveur (source of truth).
- **KMS (stratégie)**: abstraction pour supporter une intégration KMS en production, tout en gardant une dérivation locale des clés en dev.

Référence détaillée: `docs/SECURITY_DECISION_LOG.md`

## 1. Contexte et objectifs

### Contexte

Aujourd’hui, les plateformes centralisées possèdent et contrôlent la majorité des données personnelles (profil, contacts, documents, historiques). Les utilisateurs manquent de visibilité, de contrôle et d’un mécanisme simple pour donner un accès limité et révoquable à des applications tierces.

### Objectif général

Concevoir et développer une application web (PWA possible) — **Personal Data Vault** — qui permet à un utilisateur de stocker, contrôler et partager ses données personnelles. Les applications tierces doivent demander un **consentement explicite**, reçoivent un **jeton d’accès limité** (scope & durée), et chaque accès est **journalisé** et **révocable**.

### Enjeux pédagogiques & professionnels

- Maîtrise de l’architecture sécurisée (chiffrement, gestion de tokens)
- Conception d’un flux d’autorisation inspiré d’OAuth mais adapté au modèle utilisateur‑centrique
- Gestion du filtrage de données (field-level scope), journalisation et révocabilité
- Réalisation d’une interface utilisateur claire pour la gestion du consentement

---

## 2. Périmètre (Scope)

### Inclut (MVP)

- Authentification utilisateur (email + mot de passe; option OAuth social)
- Interface utilisateur : vault (liste de données), écran de consentement, tableau de bord « accès actifs »
- Portail développeur pour enregistrement d’applications tierces (client_id, client_secret)
- API RESTful sécurisée pour demandes de consentement, émission de tokens, accès aux données
- Token court‑terme, scoped (champs précis) et horodaté (exp date)
- Journal d’accès et interface d’audit pour l’utilisateur
- Révocation manuelle de jetons et invalidation immédiate
- Chiffrement des données sensibles au repos (encrypted-at-rest)

### Hors scope (version future/optionnelle)

- Anchoring des logs sur une blockchain ou IPFS
- Intégration automatique avec fournisseurs d’identité externes avancés (SAML, OpenID Connect complex flows)
- Partage de flux de données en continu (webhooks pushes complexes)
- SANDBOX exécution de code tiers sur serveur (sécurité avancée)

---

## 3. Acteurs et rôles

- **Utilisateur (Data Owner)** : possède la vault, gère ses données, approuve ou refuse les accès, consulte l’historique et révoque les jetons.
- **Third‑party App (Client)** : application externe qui s’enregistre, demande l’accès aux données d’un utilisateur et utilise le jeton pour récupérer les champs approuvés.
- **Admin / Opérateur (optionnel)** : gère la plateforme, modère les applications (validation), consulte métriques et logs.

---

## 4. User Stories (scénarios)

> Chaque user story est accompagnée d’un critère d’acceptation (AC).
> 

### 4.1. Utilisateur

1. **US‑01 : S’inscrire et se connecter**
    - En tant qu’utilisateur, je veux m’inscrire (email/mot de passe) et me connecter pour accéder à ma vault.
    - **AC:** Création de compte + login fonctionnels, e‑mail de confirmation (optionnel).
2. **US‑02 : Voir et gérer mes données**
    - En tant qu’utilisateur, je veux voir mes données (profil, contacts, documents) organisées par catégories et pouvoir ajouter/modifier/supprimer des éléments.
    - **AC:** CRUD sur ressources personnelles avec UI intuitive; modifications chiffrées au repos.
3. **US‑03 : Recevoir une demande d’accès**
    - En tant qu’utilisateur, je veux une page de consentement claire indiquant l’application, la finalité, les champs demandés et la durée.
    - **AC:** Affichage de la demande de consentement avec possibilité d’approuver ou refuser.
4. **US‑04 : Approuver / refuser et limiter l’accès**
    - En tant qu’utilisateur, je veux approuver l’accès uniquement aux champs nécessaires et définir la durée d’accès.
    - **AC:** Génération d’un token scoped et expirant lorsque j’approuve; refus bloque tout accès.
5. **US‑05 : Voir les accès actifs & révoquer**
    - En tant qu’utilisateur, je veux voir la liste des applications qui ont actuellement accès et pouvoir révoquer un accès immédiatement.
    - **AC:** Interface listant les jetons actifs avec bouton Revoke → token invalidé.
6. **US‑06 : Consulter l’historique d’accès**
    - En tant qu’utilisateur, je veux un journal (audit log) montrant qui a accédé à quelles données et quand.
    - **AC:** Journal consultable avec filtres dates, application, champ accédé.
7. **US‑07 : Exporter / supprimer mes données**
    - En tant qu’utilisateur, je veux exporter ou supprimer mes données (right to be forgotten).
    - **AC:** Export JSON/PDF des données et suppression complète (avec confirmation et logs).

### 4.2. Application tierce (Third‑party)

1. **US‑08 : Enregistrer une application**
    - En tant que développeur, je veux enregistrer mon application pour obtenir un client_id et client_secret.
    - **AC:** Portail dev: enregistrement app, création de credentials, gestion redirect_uris.
2. **US‑09 : Demander l’accès à un utilisateur**
    - En tant qu’app, je veux soumettre une demande de consentement (champs + durée + purpose) et recevoir le token après validation par l’utilisateur.
    - **AC:** Endpoint `/consent/request` qui crée la demande; redirection vers vault consent UI via redirect_url.
3. **US‑10 : Utiliser le token pour lire les champs autorisés**
- En tant qu’app, je veux appeler l’API Vault avec le token et obtenir uniquement les champs permis.
- **AC:** API vérifie scope et expiration et retourne uniquement les champs demandés.
1. **US‑11 : Gérer erreurs et révocation**
- En tant qu’app, je veux gérer les erreurs (token expiré, révoqué) et afficher un message clair à l’utilisateur final.
- **AC:** Codes HTTP clairs (401/403), messages décrivant l’état (expired, revoked).

### 4.3. Admin (optionnel)

1. **US‑12 : Valider / bloquer applications**
- En tant qu’admin, je veux approuver ou bloquer des applications suspectes.
- **AC:** Panel d’admin avec liste d’applications et actions Approve/Block.

---

## 5. Flux d’autorisation détaillé (exécution)

1. **App s’enregistre** → reçoit `client_id` & `client_secret`.
2. **App requiert consentement** pour un utilisateur (POST `/consent/request` avec `redirect_url`).
3. **Vault affiche l’écran de consentement** à l’utilisateur.
4. **Utilisateur approuve** → système génère un `access_token` (JWT signé ou opaque) avec métadonnées : scopes (list of fields), issued_at, expires_at, client_id, consent_id.
5. **App reçoit token via redirect** (ou via server flow) et appelle `/vault/data` avec `Authorization: Bearer <token>`.
6. **Vault vérifie token** (signature/validité/exp/consent) et renvoie uniquement les champs autorisés.
7. **Utilisateur peut révoquer** → backend invalide le token (blacklist) et journalise la révocation.

---

## 6. API - Endpoints principaux (exemples)

- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login (returns session JWT)
- `GET /api/vault/profile` — get user profile (requires user session)
- `POST /api/vault/data` — create/update vault entry
- `POST /api/dev/apps` — register third‑party app (returns client_id, client_secret)
- `POST /api/consent/request` — third‑party creates consent request (redirect_url)
- `GET /api/consent/:id` — view consent request (user)
- `POST /api/consent/:id/approve` — user approves → issue access token
- `POST /api/consent/:id/deny` — user denies
- `GET /api/vault/data` — third‑party reads data with `Authorization: Bearer <token>` (scoped)
- `GET /api/audit/logs` — user retrieves audit logs
- `POST /api/token/revoke` — revoke a token (user or admin)

---

## 7. Modèle de données (haut niveau)

- **Users**: id, email, password_hash, public_profile, encrypted_data_refs, created_at
- **VaultEntries**: id, user_id, category, field_key, encrypted_value, meta, created_at, updated_at
- **ThirdPartyApps**: id, name, client_id, client_secret_hash, redirect_uris, owner_user_id, status
- **Consents**: id, app_id, user_id, requested_fields, purpose, duration_hours, status, created_at
- **Tokens**: id, consent_id, token_hash, scopes, issued_at, expires_at, revoked_at
- **AuditLogs**: id, actor (app or user), action (read/write/approve/revoke), fields, timestamp, ip

---

## 8. Sécurité & confidentialité

- **Chiffrement au repos:** données sensibles chiffrées (libsodium / AES‑GCM) avec une clé dérivée par utilisateur (ou KMS optionnel).
- **Chiffrement en transit:** TLS (HTTPS) obligatoire.
- **Gestion des secrets:** client_secret stocké haché; tokens JWT signés avec clé serveur et/ou usage d’opaque tokens stockés en DB + blacklist pour révocation.
- **Principes de moindre privilège:** scope minimal (field-level) et durée minimale par défaut (ex: 24h).
- **Journalisation & audits:** toutes les demandes d’accès journalisées et visibles par l’utilisateur.
- **Protection contre replay / CSRF / XSS:** CORS, CSRF tokens pour formulaires, input validation, rate limiting.
- **Backups & GDPR:** procédures d’export/suppression conformes au droit à l’oubli.

---

## 9. UX / Wireframes (à alto niveau)

1. **Landing / Login / Signup**
2. **Vault Dashboard** — catégories, aperçu rapide, recherche
3. **Data Item View/Edit** — formulaire pour champs (avec indication de chiffrement)
4. **Consent Screen** — app logo, purpose, fields requested, duration, Approve/Deny
5. **Active Accesses** — liste de tokens + Revoke button
6. **Audit Logs** — table filtrable
7. **Dev Portal** — register app, manage credentials

---

## 10. Critères d’acceptation & tests

- **Fonctionnel:** un tiers enregistré ne peut lire des champs tant que l’utilisateur n’a pas approuvé la demande.
- **Sécurité:** une requête avec token révoqué doit être refusée (401/403).
- **Confidentialité:** données exportées ne contiennent pas de métadonnées sensibles (ex: keys).
- **Robustesse:** UI gère erreurs (expired token, invalid scope) et affiche messages clairs.
- **Performance:** lecture de petits jeux de champs doit répondre < 300ms sous charge limitée.

---

## 11. Livrables

- Code source (frontend + backend) sur GitHub avec README clair
- Diagramme d’architecture (PDF)
- API spec (OpenAPI / Swagger)
- Tests unitaires & d’intégration essentiels (Jest, supertest)
- Démo déployée (Vercel pour frontend, Railway/Heroku/Server for backend or Docker)
- Vidéo de démonstration (2–3 minutes)
- Rapport technique / documentation (explications sur sécurité, choix techniques)

---

## 12. Planning suggéré (exemple: 8 semaines)

> Exemple à ajuster selon durée réelle du projet / contraintes pédagogiques.
> 
- **Semaine 1:** Spécifications, architecture, modèle de données, wireframes.
- **Semaine 2:** Authentification, modèle utilisateur, CRUD vault entries.
- **Semaine 3:** Dev portal (registre d’app), UI consent screen, flux consent basic.
- **Semaine 4:** Token issuance, scoped API, token validation.
- **Semaine 5:** Audit logs, revocation flow, encrypted storage integration.
- **Semaine 6:** Tests, security hardening, admin tools.
- **Semaine 7:** Deployment, CI/CD, UX polish.
- **Semaine 8:** Final demo, report, video et buffers pour corrections.

---

## 13. Stack technique recommandé

- **Frontend:** Next.js, TypeScript, Tailwind CSS, PWA support (optionnel).
- **Backend:** NestJS , REST api, JWT / opaque token support.
- **DB:** PostgreSQL (ACID logs) + optional MongoDB for flexible vault entries.
- **Storage:** S3-compatible for file blobs (encrypted)
- **Auth/crypto:** libsodium / node‑crypto, bcrypt/argon2 for passwords.
- **Infrastructure:** Docker, GitHub Actions (CI), Vercel/Railway/AWS for deployment.

---