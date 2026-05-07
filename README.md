# FamilyOS / Familien-Cockpit

Mobile-first MVP für Familien-Finanzen, Regeln, Konsequenzen und Belohnungen.

## Aktueller Stand: Sprint 1

Umgesetzt:

- Next.js App Router mit TypeScript und Tailwind CSS
- PostgreSQL per Docker Compose auf Host-Port `54329`
- Prisma 6.19.3 mit V1-Kernschema (`User`, `Family`, `FamilyUser`, `FamilyMember`)
- Auth-Erweiterung mit `passwordHash` und `Session`
- eigene Cookie-basierte Registrierung, Login und Logout
- Passwort-Hashing mit `scrypt`
- transaktionale Familien-Erstellung beim Registrieren
- geschützter `/app`-Bereich mit Server-Component-Familienkontext
- Dashboard mit echtem Familiennamen, Nutzer und Rolle
- Platzhalter-Seiten für Familie und Setup
- mobile App-Shell mit Header und Bottom Navigation
- Healthcheck unter `/app/health`
- Unit-Tests für Auth-Utilities

Noch nicht umgesetzt:

- Kinder-/Familienmitglied-Verwaltung
- Finanzen, gemeinsame Ausgaben und Projekt-Splits
- Regeln, Konsequenzen, Belohnungen und Punkte
- Einladungen für weitere Eltern/Betreuer

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
- Registrierung: <http://localhost:3000/register>
- Login: <http://localhost:3000/login>
- App-Dashboard: <http://localhost:3000/app>
- Healthcheck: <http://localhost:3000/app/health>

## Checks

```bash
npm test
npm run lint
npm run build
```

## Manuelle Smoke-Checks für Sprint 1

1. `/register` öffnen.
2. Name, E-Mail, Passwort mit mindestens 8 Zeichen und Familienname eintragen.
3. Absenden und Weiterleitung nach `/app` prüfen.
4. Dashboard muss Familienname, Nutzername und Rolle `owner` anzeigen.
5. Logout klicken und prüfen, dass `/login` erscheint.
6. Mit derselben E-Mail und Passwort erneut einloggen.

## Wichtige Architektur-Regeln

- Planungsdokumente bleiben unter `~/familienapp/planung`.
- App-Code liegt unter `~/familienapp/app`.
- `familyId` darf später nie vom Client vertraut werden.
- Alle Familienabfragen müssen über serverseitigen Familienkontext gescoped werden.
- Geld-/Punkte-Module kommen erst nach Auth und Familienkontext.
