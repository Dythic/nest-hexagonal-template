# Nest Hexagonal Template

NestJS + Fastify service following a hexagonal, functional DDD architecture.

Template de service **NestJS 11 + Fastify**, **Zod 4** (via `nestjs-zod`), **Firestore** et **Pub/Sub** (GCP), organisé en architecture hexagonale "Functional DDD". Les règles de code à respecter sont dans [GEMINI.md](GEMINI.md).

## Démarrer un nouveau projet

Depuis ce template :

```bash
npm run create:project -- billing-service --title "Billing Service"
```

Le projet est copié dans `../billing-service` (ou dans `--target <dossier>`), avec le nom du package, le titre Swagger et le README renommés. Ensuite :

```bash
cd ../billing-service
npm install
cp .env.example .env
npm run emulators
npm run start:dev
```

- API : http://localhost:3000
- Swagger : http://localhost:3000/api-docs
- Health : http://localhost:3000/health

## Ajouter une feature

```bash
npm run generate:feature -- purchase-order
```

Génère une tranche verticale complète qui suit le data flow de [GEMINI.md](GEMINI.md), puis l'enregistre dans `src/app.module.ts` :

| Couche | Fichiers |
| --- | --- |
| Domain | `domain/models/<name>.model.ts` (Entity, Props, UnsavedEntity), `domain/models/<name>.factory.ts`, `domain/ports/<name>-persistence.port.ts` |
| Application | `application/use-cases/create-<name>`, `get-<name>`, `list-<names>` |
| Inbound | `infrastructure/inbound/api/<name>.controller.ts`, `dto/create-<name>-request.dto.ts`, `dto/<name>-response.dto.ts` |
| Outbound | `infrastructure/outbound/persistence/firestore/{entities,mappers,adapters}/<name>…` |
| Module | `src/<name>.module.ts` |
| Tests | factory, use cases (avec adapter in-memory) et e2e |

Options : `--plural <nom>` si le pluriel automatique est faux, `--force` pour écraser.

## Structure

```text
src/
 ┣ domain/
 ┃ ┣ errors/        DomainError, BusinessRuleViolationError, ItemNotFoundError
 ┃ ┣ models/        Schémas Zod, types inférés, factories (pagination fournie)
 ┃ ┗ ports/         Classes abstraites (MessagePublisher fourni)
 ┣ application/
 ┃ ┗ use-cases/
 ┣ infrastructure/
 ┃ ┣ config/        Validation Zod des variables d'environnement, token APP_CONFIG
 ┃ ┣ logging/       nestjs-pino (JSON en prod, pino-pretty en LOG_MODE=debug)
 ┃ ┣ inbound/
 ┃ ┃ ┣ api/         Controllers, DTO request/response, décodeur Pub/Sub push
 ┃ ┃ ┗ exception-filters/
 ┃ ┗ outbound/
 ┃   ┣ messaging/pubsub/        Adapter MessagePublisher
 ┃   ┗ persistence/firestore/   Client, converter Zod, base document
 ┣ app.module.ts
 ┣ app.setup.ts     Filtres globaux + Swagger (partagé avec les tests e2e)
 ┗ main.ts
```

Les dépendances entre couches sont vérifiées par ESLint : le domaine ne peut importer ni NestJS, ni Firebase, ni les couches externes ; l'application ne peut pas importer l'infrastructure. `class-validator`, `class-transformer` et Express sont interdits partout.

## Publier sur Pub/Sub

Déclarez chaque topic et son payload dans `TopicEventMap` (`src/domain/ports/message-publisher.port.ts`), importez `PubSubModule` dans le module de la feature, puis injectez `MessagePublisher` dans le use case :

```ts
export type TopicEventMap = Readonly<{
  'invoice-created': Readonly<{ invoiceId: string }>;
}>;
```

Pour consommer un push Pub/Sub, ajoutez un endpoint qui reçoit un `PubSubPushEnvelopeRequestDto` et décode le payload avec `decodePubSubPushMessage(envelope, Schema)`.

## Erreurs HTTP

Toutes les erreurs suivent le format `AppErrorResponse` (`statusCode`, `message`, `error`, `timestamp`, `path`, `details`) :

| Source | Statut |
| --- | --- |
| Validation Zod de la requête | 400 avec `details` par champ |
| `BusinessRuleViolationError` | 400 |
| `ItemNotFoundError` | 404 |
| `HttpException` Nest | son statut |
| Toute autre erreur | 500 (loggée, message masqué) |

## Variables d'environnement

| Variable | Défaut | Description |
| --- | --- | --- |
| `ENV` | `local` | Nom de l'environnement |
| `PORT` | `3000` | Port HTTP |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `LOG_MODE` | `prod` | `prod` (JSON) ou `debug` (pino-pretty) |
| `GCP_PROJECT_ID` | | Projet GCP |
| `FIRESTORE_DATABASE_ID` | `(default)` | Base Firestore |
| `FIRESTORE_EMULATOR_HOST` | | Ex. `localhost:8080` |
| `PUBSUB_EMULATOR_HOST` | | Ex. `localhost:8085` |

Pour ajouter une variable : l'ajouter dans `config.schema.ts` puis la mapper dans `config.mapper.ts`. Pour un booléen, utilisez `z.stringbool()` (et non `z.coerce.boolean()`, qui transforme `"false"` en `true`).

## Scripts

| Script | Rôle |
| --- | --- |
| `start:dev` | Build puis watch (tsc + tsc-alias + node --watch) |
| `build` / `start` | Build de production dans `dist/` puis lancement |
| `test`, `test:unit`, `test:e2e`, `test:coverage` | Vitest (SWC pour les métadonnées de décorateurs) |
| `lint`, `format`, `typecheck` | ESLint, Prettier, tsc |
| `emulators` | Émulateurs Firestore et Pub/Sub via Docker Compose |
