# FamilyOS / Familien-Cockpit

Mobile-first MVP für Familien-Finanzen, Regeln, Konsequenzen und Belohnungen.

## Aktueller Stand: Sprint 2

Umgesetzt:

- Next.js App Router mit TypeScript und Tailwind CSS
- PostgreSQL per Docker Compose auf Host-Port `54329`
- Prisma 6.19.3 mit V1-Kernschema (`User`, `Family`, `FamilyUser`, `FamilyMember`)
- eigene Cookie-basierte Registrierung, Login und Logout
- Passwort-Hashing mit `scrypt`
- transaktionale Familien-Erstellung beim Registrieren
- geschützter `/app`-Bereich mit Server-Component-Familienkontext
- Dashboard mit echtem Familiennamen, Nutzer, Kinderanzahl und Familienprofilen
- Familienseite zum Anlegen von Kinder-, Eltern- und sonstigen Profilen
- serverseitig gescopte `FamilyMember`-Queries und Server Action
- mobile App-Shell mit Header und Bottom Navigation
- Healthcheck unter `/app/health`
- Unit-Tests für Auth-Utilities und FamilyMember-Input

Noch nicht umgesetzt:

- Finanzen, gemeinsame Ausgaben und Projekt-Splits
- Regeln, Konsequenzen, Belohnungen und Punkte
- Einladungen für weitere Eltern/Betreuer
- Bearbeiten/Löschen von Familienprofilen

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
- Familie/Kinderprofile: <http://localhost:3000/app/family>
- Healthcheck: <http://localhost:3000/app/health>

## Checks

```bash
npm test
npm run lint
npm run build
```

## Manuelle Smoke-Checks

### Sprint 1: Auth

1. `/register` öffnen.
2. Name, E-Mail, Passwort mit mindestens 8 Zeichen und Familienname eintragen.
3. Absenden und Weiterleitung nach `/app` prüfen.
4. Dashboard muss Familienname, Nutzername und Rolle `owner` anzeigen.
5. Logout klicken und prüfen, dass `/login` erscheint.
6. Mit derselben E-Mail und Passwort erneut einloggen.

### Sprint 2: Familienprofile

1. Eingeloggt `/app/family` öffnen.
2. Profilname eintragen, Rolle `Kind` wählen und optional Icon/Farbe setzen.
3. Speichern und prüfen, dass das Profil in der Liste erscheint.
4. `/app` öffnen und prüfen, dass Kinderanzahl und Profilkarte aktualisiert sind.

## Wichtige Architektur-Regeln

- Planungsdokumente bleiben unter `~/familienapp/planung`.
- App-Code liegt unter `~/familienapp/app`.
- `familyId` darf später nie vom Client vertraut werden.
- Alle Familienabfragen müssen über serverseitigen Familienkontext gescoped werden.
- Geld-/Punkte-Module kommen erst nach Auth und Familienkontext.
