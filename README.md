# FamilyOS / Familien-Cockpit

Mobile-first MVP für Familien-Finanzen, Regeln, Konsequenzen und Belohnungen.

## Sprint-0-Stand

Umgesetzt:

- Next.js App Router mit TypeScript und Tailwind CSS
- PostgreSQL per Docker Compose
- Prisma mit V1-Kernschema (`User`, `Family`, `FamilyUser`, `FamilyMember`)
- wiederverwendbarer Prisma Client in `lib/db.ts`
- mobile App-Shell unter `/app`
- Healthcheck unter `/app/health`
- UI-Basiskomponenten

Noch nicht umgesetzt:

- Auth/Login/Register
- echte Familien-/Kind-Verwaltung
- Finanzen, Projekte, Regeln, Konsequenzen, Punkte

## Lokaler Start

```bash
cd ~/familienapp/app
cp .env.example .env
npm install
```

## Datenbank starten

```bash
docker compose create postgres
docker compose start postgres
```

Health prüfen:

```bash
docker compose ps
```

## Prisma

Client generieren:

```bash
npm run db:generate
```

Migration ausführen:

```bash
npm run db:migrate -- --name init
```

Prisma Studio optional:

```bash
npm run db:studio
```

## App starten

```bash
npm run dev
```

Dann öffnen:

- Startseite: <http://localhost:3000>
- App-Shell: <http://localhost:3000/app>
- Healthcheck: <http://localhost:3000/app/health>

## Checks

```bash
npm run lint
npm run build
```

## Wichtige Architektur-Regeln

- Planungsdokumente bleiben unter `~/familienapp/planung`.
- App-Code liegt unter `~/familienapp/app`.
- `familyId` darf später nie vom Client vertraut werden.
- Geld-/Punkte-Module kommen erst nach Auth und Familienkontext.
