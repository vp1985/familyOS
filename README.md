# FamilyOS / Familien-Cockpit

Mobile-first MVP für Familien-Finanzen, Regeln, Konsequenzen und Belohnungen.

## Aktueller Stand: Sprint 3

Umgesetzt:

- Next.js App Router mit TypeScript und Tailwind CSS
- PostgreSQL per Docker Compose auf Host-Port `54329`
- Prisma 6.19.3 mit V1-Kernschema (`User`, `Family`, `FamilyUser`, `FamilyMember`)
- eigene Cookie-basierte Registrierung, Login und Logout
- Passwort-Hashing mit `scrypt`
- transaktionale Familien-Erstellung beim Registrieren
- geschützter `/app`-Bereich mit Server-Component-Familienkontext
- Dashboard mit echtem Familiennamen, Nutzer, Kinderanzahl, Familienprofilen und Kinder-Geldsumme
- Familienseite zum Anlegen von Kinder-, Eltern- und sonstigen Profilen
- automatische Kinderkonten für neue Kinderprofile
- Kinder-Finanzseite unter `/app/finance` mit Guthaben je Kind, Gesamtguthaben und Verlauf
- Geldbewegungen für `Taschengeld`, `Leihe/Ausgabe`, `Rückzahlung` und `Korrektur auf Betrag`
- serverseitig gescopte `FamilyMember`-, `FinanceAccount`- und `MoneyTransaction`-Queries und Server Actions
- mobile App-Shell mit Header und Bottom Navigation
- Healthcheck unter `/app/health`
- Unit-Tests für Auth-Utilities, FamilyMember-Input und Geldlogik

Noch nicht umgesetzt:

- gemeinsame Ausgaben und Projekt-Splits zwischen mehreren Personen
- Regeln, Konsequenzen, Belohnungen und Punkte
- Einladungen für weitere Eltern/Betreuer
- Bearbeiten/Löschen von Familienprofilen
- Bearbeiten/Löschen/Storno von Geldbewegungen

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

Sprint-3-Migration heißt aktuell `add_child_finances`.

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
- Kinder-Finanzen: <http://localhost:3000/app/finance>
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

### Sprint 3: Kinder-Finanzen

1. Eingeloggt `/app/finance` öffnen.
2. Prüfen, dass jedes Kinderprofil ein Kinderkonto und das Gesamtguthaben angezeigt wird.
3. Kind wählen, Betrag z. B. `10,50`, Art `Taschengeld / Plus` und Titel eintragen.
4. Speichern und prüfen, dass Guthaben, Kinderkonto und Verlauf aktualisiert sind.
5. Optional `Leihe / Ausgabe`, `Rückzahlung` und `Korrektur auf Betrag` testen.

## Wichtige Architektur-Regeln

- Planungsdokumente bleiben unter `~/familienapp/planung`.
- App-Code liegt unter `~/familienapp/app`.
- `familyId` darf später nie vom Client vertraut werden.
- Alle Familienabfragen müssen über serverseitigen Familienkontext gescoped werden.
- Geld- und Punkte-Module müssen transaktional schreiben, sobald sie Salden verändern.
- Für Geldbeträge intern immer Cent-Integer verwenden, nie Float-Werte.
