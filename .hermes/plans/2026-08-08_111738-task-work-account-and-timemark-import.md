# FamilyOS Aufgabenzeit, Arbeitskonto und TimeMark-Import Implementation Plan

> **For Hermes:** Use `subagent-driven-development` to execute this plan task-by-task.

**Goal:** Aufgaben erhalten nachvollziehbare Zeitprotokolle, Eltern können reale Referenzläufe in wiederverwendbare Aufgaben umwandeln, und Kinder erhalten je Aufgabe entweder einen festen Eurobetrag oder einen Euro-Stundensatz auf ein separates virtuelles Arbeitskonto. Später können bestätigte TimeMark-Sitzungen nach einer expliziten Benutzerverknüpfung manuell übernommen werden.

**Architecture:** FamilyOS bleibt die fachliche Quelle für Aufgaben, Freigaben, Arbeitskonto und Auszahlungen. Zeit wird serverseitig aus Start-/Pause-/Endzeitpunkten berechnet; der Browser liefert niemals frei editierbare Laufzeit oder Vergütung. `TaskTemplate` hält Defaultregeln; `TaskOccurrence` snapshottet sie. Ein separates, revisionssicheres Arbeitskonto führt Euro-Gutschriften und -Ausgleichsbuchungen, ohne bestehende Dr-/Aufgabenpunkte oder Kinder-Finanzkonten umzudeuten. Eine spätere TimeMark-Anbindung ist ein manuelles, idempotentes Import-Gateway für abgeschlossene, versionierte Sitzungen — keine Synchronisierung im Hintergrund.

**Tech Stack:** Bestehendes Next.js 16 App Router/React 19/TypeScript, Prisma 6/PostgreSQL, Zod 4, bestehende Server-Action- und `node:test`-Struktur.

---

## Beschlossene Fachregeln

- Jede Aufgabe kann Zeit erfassen. Bezahlbarkeit gilt **nur für Kinder**.
- Lohnmodell je Aufgabeninstanz: `NONE`, `FIXED_AMOUNT` oder `HOURLY_RATE`; Modelle werden nie addiert.
- Vorlagen definieren Defaults, die konkrete Aufgabeninstanz darf sie überschreiben.
- Eine Eltern-Referenzzeit kann beim Anlegen aus einem eigenen Zeitlauf entstehen; Eltern ergänzen Beschreibung, Unteraufgaben/Checkliste und korrigieren die daraus abgeleitete **geschätzte Kinderzeit** bewusst.
- Real gemessene Kinderzeiten werden als Statistik ausgewertet und führen höchstens zu einem Vorschlag für eine neue Schätzung — nie zu einer automatischen Änderung.
- Kinder sehen live Stundensatz, Dauer und erwartete Eurovergütung; bei Festbetrag sehen sie den Festbetrag und die erfasste Dauer. Vergütung bleibt bis zur Elternfreigabe unverbindlich.
- Pro Person läuft höchstens ein Timer; Pause/Fortsetzen ist möglich. Um Mitternacht stoppt ein Lauf verbindlich und benachrichtigt arbeitendes Kind sowie Erwachsene. Eine aufgabenbezogene Höchstdauer ist nur eine Warnschwelle; sie stoppt nicht automatisch.
- Mehrere Kinder dürfen auf derselben Aufgabe parallel arbeiten und erhalten nur ihre jeweilige bestätigte Zeit. Der Aufgabenabschluss bleibt ein eigener Schritt.
- Nur Erwachsene können beliebige Aufgaben timen; Kinder nur ihnen zugewiesene. Offene eigene Zeitbuchungen kann ein Kind mit Grund stornieren.
- Unbezahlte Zeiten können je Aufgabe sofort gespeichert oder freigabepflichtig sein.
- Erwachsene dürfen freigeben, ablehnen, zur Korrektur zurückgeben oder Zeiten direkt korrigieren. Ablehnung/Korrektur braucht einen Grund. Nach bereits gebuchter Vergütung erzeugt jede Änderung eine sichtbare Ausgleichsbuchung, nie eine stille Änderung der ursprünglichen Buchung. Ein daraus entstehender negativer Arbeitskontosaldo wird mit künftigem Guthaben verrechnet.
- Arbeitsguthaben ist ein separates virtuelles Konto **in Euro**. Ein Kind beantragt Auszahlung: bar nur in 10-€-Schritten, Überweisung centgenau. Erwachsene bestätigen und dokumentieren Methode/Datum/Status; IBAN wird nicht gespeichert.
- Kind sieht nur eigenes Arbeitskonto und eigene Zeitbuchungen; Erwachsene sehen alle.
- TimeMark-Import: Nach expliziter Benutzerverknüpfung nur abgeschlossene Sitzungen, immer manuell sichtbar, immer einer FamilyOS-Aufgabe zugeordnet, nie als laufender Timer fortgeführt und nie automatisch vergütet.

## Bestehender Anschluss

- `prisma/schema.prisma` enthält bereits `TaskTemplate`, `TaskOccurrence`, `TaskSubTask`, `TaskOccurrenceSubTask`, Punkte- und Geldbuchungen.
- `lib/tasks.ts` erzeugt bereits Vorlagen/Instanzen, snapshottet aktuelle Belohnungen und bucht bei Bestätigung. Das neue Lohnmodell darf diese bestehende pauschale `moneyRewardCents`-Logik nicht doppelt auslösen.
- `app/app/tasks/new/page.tsx`, `app/app/tasks/page.tsx` und `app/app/kids/page.tsx` sind die vorhandenen Aufgaben-Einstiege.
- TimeMarks Plan (`/root/timemark/.hermes/plans/2026-08-07_114825-time-tools.md`) verwendet abschließbare, versionierte `TimerSession`-Snapshots mit Timeline. FamilyOS definiert nur den späteren Importvertrag; TimeMark erhält seine Integrationsanweisung separat im TimeMark-Chat.

## Nicht in diesem Paket

- Keine direkte Store-/Datenbankkopplung zu TimeMark, keine Background-Synchronisierung und kein Starten/Fortsetzen von FamilyOS-Timern aus TimeMark.
- Keine Speicherung von Bankdaten oder Ausführung von Überweisungen.
- Keine automatische Anpassung der geschätzten Dauer, der Vergütung oder einer Aufgabeninstanz.
- Keine Änderungen an TimeMark in diesem Repository/Chat.

---

### Task 1: Task-Lohn- und Zeitschema als reine Domänentypen definieren

**Objective:** Eine einzige, testbare Quelle für Lohnmodelle, Zeitstatus, Berechnung und erlaubte Zustandswechsel schaffen.

**Files:**
- Create: `lib/task-time.ts`
- Create: `tests/task-time.test.ts`

**Step 1: Failing Tests für Lohnmodell und Zeitberechnung schreiben**

Testfälle mit festen UTC-Zeitpunkten:
- `NONE`, `FIXED_AMOUNT`, `HOURLY_RATE` sind exklusiv; ein fester Betrag und ein Stundensatz zugleich werden abgewiesen.
- Ein 30-Minuten-Lauf bei 800 Cent/Stunde ergibt exakt 400 Cent.
- Pausen erhöhen die Dauer nicht.
- Festbetrag bleibt bei jeder Dauer exakt gleich.
- `expectedChildDurationMinutes` ist eine positive ganze Minutenangabe oder `null`.
- Überschreiten der Warnschwelle meldet `warningReached`, beendet die Buchung aber nicht.

**Step 2: Minimalen Parser und Pure Functions implementieren**

Exportieren:
- `TaskPayMode`, `TaskTimeStatus`, `TaskTimeSource`
- `parseTaskCompensationConfig(...)`
- `elapsedWorkedMs(entry, now)`
- `expectedAmountCents(entry, now)`
- `isTimerWarningReached(entry, now)`
- `canApplyTaskTimeAction(entry, action, now)`

Die Berechnung darf nur servereigene Zeitpunkte, den gesnapshotteten Satz/Festbetrag und akkumulierte Pausen verwenden.

**Step 3: Focused Test ausführen**

Run: `npm test -- tests/task-time.test.ts`
Expected: alle Zeit-/Geldgrenzen grün.

**Step 4: Commit**

```bash
git add lib/task-time.ts tests/task-time.test.ts
git commit -m "feat: add task time compensation domain"
```

### Task 2: Prisma-Modell mit Instanz-Snapshots und revisionssicherem Arbeitskonto erweitern

**Objective:** Vorlagenregeln, Laufdaten, Zeitereignisse, Arbeitskonto, Auszahlungsanträge und spätere Import-Referenzen robust persistieren.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_task_time_work_account/migration.sql`

**Step 1: Migrationstest/Schema-Entwurf vorbereiten**

Ergänzen:
- Enums: `TaskPayMode`, `TaskTimeStatus`, `TaskTimeSource`, `WorkAccountEntryType`, `WorkPayoutStatus`, `WorkPayoutMethod`, `TimeMarkLinkStatus`.
- `TaskTemplate`: Defaultfelder `payMode`, `fixedAmountCents`, `hourlyRateCents`, `expectedChildDurationMinutes`, `timerWarningMinutes`, `unpaidTimeRequiresApproval`.
- `TaskOccurrence`: die gleichen, bei Erstellung gesnapshotteten Felder. Das bestehende `moneyRewardCents` bleibt ein separates Legacy-/Aufgabenbonusfeld und wird im neuen Lohnmodell nicht erneut verbucht.
- `TaskTimeEntry`: Familien-, Aufgabeninstanz-, Kind- und Urheberbezug; Quelle (`FAMILYOS`/später `TIMEMARK_IMPORT`); Status; gestartete/beendete/pausierte Zeit; akkumulierte Pausen; gesnapshottetes Lohnmodell/Satz/Festbetrag; Korrektur-/Ablehnungsgrund; Freigabeinformationen; Importreferenz.
- `TaskTimeEvent`: append-only Start/Pause/Resume/Stop/Cancel/Correction/Approval/Reject-Ereignisse mit Akteur, Zeitpunkt und Grund.
- `WorkAccountEntry`: append-only positive/negative Eurobuchung, Kind, verknüpfte Zeitbuchung bzw. Auszahlungsantrag, resultierender Saldo, Ersteller. Einzigartige Beziehung für die ursprüngliche Zeitgutschrift; Korrekturen referenzieren ihren Ursprung.
- `WorkPayoutRequest`: angefragter Betrag, Methode, Status, beantragt/bestätigt/ausgezahlt von/zu Zeitpunkten, Notiz. `CASH` validiert 1.000-Cent-Schritte; `TRANSFER` jeden positiven Centbetrag.
- `TimeMarkUserLink` und `TimeMarkImportReceipt`: nur die spätere explizite Verknüpfung, externe Benutzerkennung/Status/Einwilligungszeit sowie eindeutige externe Sitzungs-ID, Schema-Version und Importzeit. Kein Token/kein TimeMark-Passwort in FamilyOS speichern.

**Step 2: Relation- und Indexregeln prüfen**

- Jede relationale Abfrage ist über `familyId` tenant-sicher scannbar.
- `TaskTimeEntry` indexiert nach `familyId + childId + status`, `taskOccurrenceId`, `startedAt`.
- `WorkAccountEntry` indexiert nach `familyId + childId + createdAt`.
- `TimeMarkImportReceipt` erhält eine eindeutige Kombination aus Link und externer Session-ID, damit dieselbe Session nicht doppelt importiert werden kann.

**Step 3: Prisma erzeugen, validieren und Migration auf der konfigurierten FamilyOS-DB anwenden**

Run:

```bash
npm run db:generate
npx prisma validate
npm run db:migrate -- --name task_time_work_account
npx prisma migrate status
```

Expected: valides Schema; nur die neue, benannte Migration ist offen bzw. anschließend angewendet.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/<timestamp>_task_time_work_account
 git diff --cached --check
git commit -m "feat: persist task time and work accounts"
```

### Task 3: Vorlagen- und Instanzkonfiguration beim Aufgabenanlegen korrekt snapshotten

**Objective:** Eltern können im bestehenden Aufgabenformular Unteraufgaben, Referenzzeit, Schätzung, Timerwarnung, Zeitfreigabe, Zusatzpunkte und genau ein Lohnmodell festlegen.

**Files:**
- Modify: `lib/tasks.ts`
- Modify: `app/app/tasks/new/page.tsx`
- Modify: `tests/tasks.test.ts`
- Modify: `tests/tasks-page.test.ts`

**Step 1: Failing Parser-Tests ergänzen**

- Fester Betrag und Stundensatz gleichzeitig werden abgewiesen.
- Bezahlte Konfiguration mit nicht-Kind-Zuweisung wird abgewiesen.
- Optionale geschätzte Kinderzeit und Timerwarnung normalisieren auf positive Minuten.
- `unpaidTimeRequiresApproval` bleibt für unbezahlte Aufgaben unabhängig konfigurierbar.
- Die Instanzerzeugung übernimmt jeden Default als Snapshot.

**Step 2: Zod-/FormData-Parser und `generateTaskOccurrences` erweitern**

- Kein neuer paralleler Belohnungspfad: das gewählte `TaskPayMode` steuert ausschließlich spätere `WorkAccountEntry`-Buchungen.
- Behalte die bisherigen Dr/XP/Badge-Felder als separat schaltbare Aufgabenerledigungs-Belohnungen bei.
- Ergänze Formcopy: „Bezahlung: keine / Festbetrag / pro Stunde“, „Geschätzte Kinderzeit“, „Timerwarnung“, „Unbezahlte Zeit freigeben“ und klare Erläuterung, dass Punkte optional zusätzlich vergeben werden.

**Step 3: Neue Aufgabenform responsiv prüfen**

Auf 320 px: Label/Status links, Geldwerte rechts; feste Höhe und Stundensatz dürfen nicht zugleich sichtbar als aktiv aussehen.

**Step 4: Focused Tests ausführen und committen**

```bash
npm test -- tests/tasks.test.ts tests/tasks-page.test.ts
git add lib/tasks.ts app/app/tasks/new/page.tsx tests/tasks.test.ts tests/tasks-page.test.ts
git commit -m "feat: configure task timing and pay modes"
```

### Task 4: Eltern-Referenzlauf und Aufgabenprofil erfassen

**Objective:** Ein Elternteil kann eine konkrete Aufgabe selbst durchführen, Timer und Arbeitsschritte dokumentieren und daraus eine kontrollierbare Vorlage/Schätzung erstellen.

**Files:**
- Create: `app/app/tasks/reference-run/page.tsx`
- Create: `app/app/tasks/reference-run/actions.ts`
- Modify: `app/app/tasks/new/page.tsx`
- Modify: `lib/task-time.ts`
- Create: `tests/task-reference-run.test.ts`

**Step 1: Failing Tests für Referenzlauf schreiben**

- Nur Eltern/Admins dürfen Referenzläufe starten und finalisieren.
- Start/Stop erzeugt eine `TaskTimeEntry` mit Quelle `FAMILYOS`, ohne Arbeitskonto- oder Kindervergütung.
- Notizen und Unteraufgaben werden als Entwurf in den neuen Aufgabenformularfluss übernommen.
- Eltern können die gemessene Zeit explizit in eine abweichende geschätzte Kinderzeit korrigieren; die gemessene Referenzzeit bleibt erhalten.

**Step 2: Server-Action und UI implementieren**

- Referenzlauf nimmt Titel, Start/Stop, Arbeitsnotiz und dynamische Unteraufgaben auf.
- Beim „Als Aufgabe weiterverwenden“ öffnet das bestehende Aufgabenformular mit vorausgefülltem Titel, Beschreibung, Unteraufgaben und geschätzter Kinderzeit.
- Der Referenzlauf bleibt ein historischer Eintrag und wird nicht an eine Kinderinstanz oder Vergütung gebunden.

**Step 3: Browser-Smoke**

Als Elternteil: „Rasen mähen“ starten → Arbeitsschritte ergänzen → stoppen → geschätzte Kinderzeit anpassen → Aufgabe mit Checkliste anlegen. Sicherstellen, dass keine Eurobuchung erzeugt wird.

**Step 4: Tests und Commit**

```bash
npm test -- tests/task-reference-run.test.ts tests/tasks.test.ts
git add app/app/tasks/reference-run lib/task-time.ts app/app/tasks/new/page.tsx tests/task-reference-run.test.ts
git commit -m "feat: create tasks from parent reference runs"
```

### Task 5: Serverautorisierte Timer-, Korrektur- und Freigabelogik implementieren

**Objective:** FamilyOS-Timer sind gegen manipulierte Dauer, Mehrfachbuchung, fremde Aufgaben und falsche Freigabe geschützt.

**Files:**
- Create: `lib/task-time-store.ts`
- Create: `app/api/task-time/entries/route.ts`
- Create: `app/api/task-time/entries/[id]/route.ts`
- Modify: `lib/family-context.ts` (nur falls ein zentraler Eltern- vs. Kinder-Guard fehlt)
- Create: `tests/task-time-store.test.ts`
- Create: `tests/task-time-api.test.ts`

**Step 1: Failing Store-/API-Tests schreiben**

Testen:
- Kind startet nur eine eigene, zugewiesene und offene Aufgabeninstanz.
- Erwachsener darf jede Familienaufgabe starten, aber es entsteht keine bezahlte Erwachsenenzeit.
- Pro Person existiert höchstens eine laufende Zeitbuchung.
- Pause/Fortsetzen/Stop berechnet nur aus Serverzeitpunkten; ein gesendeter Restwert oder Betrag wird ignoriert.
- Kind kann nur offene eigene Einträge mit Pflichtgrund stornieren.
- Bezahlte Einträge warten auf Elternfreigabe; unbezahlte folgen der Instanzregel.
- Erwachsene dürfen freigeben/ablehnen/return-for-correction und direkt korrigieren, immer mit Grund.
- Nach Freigabe führt eine Korrektur zur Ausgleichsbuchung statt Mutation der ursprünglichen Arbeitskontobuchung.
- Zwei gleichzeitige Freigaben buchen nicht doppelt.

**Step 2: Transaktionale Store-Operationen implementieren**

Implementieren:
- `startTaskTime`, `pauseTaskTime`, `resumeTaskTime`, `stopTaskTime`, `cancelTaskTime`
- `reviewTaskTime`, `correctTaskTime`
- `closeTimersAtMidnight` als idempotente serverseitige Jobfunktion

Jede Mutation lädt die Instanz tenant-scoped, hält Zeit-/Lohn-Snapshots stabil und schreibt ein `TaskTimeEvent`. Freigabe und Arbeitskonto-Buchung laufen gemeinsam in einer Prisma-Transaktion. Bei Korrektur wird eine neue differenzielle `WorkAccountEntry` mit Verweis auf die ursprüngliche Buchung geschrieben.

**Step 3: Mitternachtsverhalten integrieren**

- Die tatsächliche Ausführung wird an die vorhandene FamilyOS-Scheduler-/Cron-Infrastruktur angeschlossen, nicht per Browser-Timeout.
- Alle zu diesem Zeitpunkt laufenden Einträge erhalten einen serverseitigen Stop-Zeitpunkt und ein Ereignis `MIDNIGHT_STOP`; Hinweise gehen an Kind und Erwachsene über den bereits etablierten Benachrichtigungsmechanismus oder werden, falls noch keiner existiert, als In-App-Hinweis persistiert.

**Step 4: Tests und Commit**

```bash
npm test -- tests/task-time-store.test.ts tests/task-time-api.test.ts
git add lib/task-time-store.ts app/api/task-time tests/task-time-store.test.ts tests/task-time-api.test.ts
git commit -m "feat: add secure task time workflow"
```

### Task 6: Virtuelles Arbeitskonto und Auszahlungsanträge aufbauen

**Objective:** Bestätigte Arbeit ist als Euroguthaben, Ausgleich und Auszahlung nachvollziehbar, ohne Kinder-Finanzkonten oder Bankdaten zu vermischen.

**Files:**
- Create: `lib/work-account.ts`
- Create: `app/app/work-account/page.tsx`
- Create: `app/app/work-account/actions.ts`
- Modify: `app/app/kids/page.tsx`
- Create: `tests/work-account.test.ts`
- Create: `tests/work-account-page.test.ts`

**Step 1: Failing Tests für Kontoregeln schreiben**

- Saldo ist die Summe append-only Buchungen und darf negativ sein.
- Auszahlungsantrag reserviert den Betrag transaktional; parallele Anträge können nicht über verfügbares Guthaben hinausgehen.
- Barbetrag muss positiv und durch 1.000 Cent teilbar sein; Transfer darf centgenau sein.
- Kinder können nur ihren eigenen Antrag anlegen/sehen; Eltern sehen und bearbeiten alle.
- Zahlungsbestätigung dokumentiert Status/Methode/Datum, aber keine IBAN.

**Step 2: Domänen- und Server-Action-Logik implementieren**

- Erzeuge Arbeitskontozeilen nur über die Zeitfreigabe/Korrekturpfade.
- Auszahlungsantrag erhält Status `REQUESTED` → `APPROVED` → `PAID` oder `REJECTED`/`CANCELLED`; jede Statusänderung wird historisch protokolliert.
- Setze bei Antragstellung eine Reservierung oder berechne Verfügbarkeit gegen offene Reservierungen in derselben Transaktion.

**Step 3: UI implementieren**

- Kindansicht: verfügbarer Eurobetrag, reservierter Betrag, Korrektursaldo, eigener Verlauf, Antrag Bar/Überweisung.
- Elternansicht: offene Zeitfreigaben, Korrekturbegründungen, Auszahlungsanträge, Bestätigungsaktion.
- Keine fremden Kinderkonten/-buchungen in der Kindansicht.

**Step 4: Tests, Browser-Smoke und Commit**

```bash
npm test -- tests/work-account.test.ts tests/work-account-page.test.ts
git add lib/work-account.ts app/app/work-account app/app/kids/page.tsx tests/work-account.test.ts tests/work-account-page.test.ts
git commit -m "feat: add child work accounts and payouts"
```

### Task 7: Timer-, Aufgaben- und Statistik-UI verbinden

**Objective:** Eltern und Kinder können die vereinbarten Flows ohne verdeckte finanzielle Folgen bedienen.

**Files:**
- Modify: `app/app/tasks/page.tsx`
- Modify: `app/app/kids/page.tsx`
- Create: `app/app/tasks/[occurrenceId]/time/page.tsx`
- Create: `app/app/tasks/[occurrenceId]/time/actions.ts`
- Create: `lib/task-time-statistics.ts`
- Create: `tests/task-time-statistics.test.ts`
- Modify: `tests/tasks-page.test.ts`

**Step 1: Statistiktests schreiben**

- Auswertung trennt Referenzläufe von realen Kinderzeiten.
- Nur abgeschlossene, nicht stornierte Zeiten mit derselben Vorlagenfamilie fließen ein.
- Liefere Anzahl, Median/Spannweite und eine mögliche geschätzte Kinderzeit; nie eine automatische Mutation.
- Team-/Parallelzeiten werden pro Kind getrennt ausgewertet.

**Step 2: Aufgabenzeit-Runner implementieren**

- Große mobile Start/Pause/Stop-Aktion, laufende Dauer und bei Stundenlohn erwarteter Betrag.
- Bei Festbetrag: feste Vergütung und Dauer sichtbar, ohne einen falschen laufenden Lohn hochzuzählen.
- Warnhinweis bei Schwelle; kein automatischer Stop.
- Checkliste/Unteraufgaben, Zeitabschluss und Aufgabenabschluss bleiben getrennte Aktionen.

**Step 3: Elternansicht ergänzen**

- Zeige Zeitverlauf, Prüfqueue, Korrektur-/Ablehnungsgründe und Vorschlag zur geschätzten Kinderzeit.
- Der Vorschlag muss durch eine bewusste Aktion auf Vorlage oder konkrete Instanz übernommen werden.

**Step 4: Browser-Smoke**

- Stundenlohn: Kind startet, pausiert, stoppt; Erwachsener sieht erwarteten Betrag, korrigiert und gibt frei.
- Festbetrag: Kind erfasst Zeit; Auszahlung bleibt exakt fest.
- Unbezahlte Aufgabe mit Freigabepflicht und ohne Freigabepflicht.
- Zwei Kinder timen dieselbe Aufgabe parallel.

**Step 5: Commit**

```bash
npm test -- tests/task-time-statistics.test.ts tests/tasks-page.test.ts
git add app/app/tasks/page.tsx app/app/kids/page.tsx app/app/tasks/[occurrenceId]/time lib/task-time-statistics.ts tests/task-time-statistics.test.ts tests/tasks-page.test.ts
git commit -m "feat: add task time runner and estimates"
```

### Task 8: Manuellen, später aktivierbaren TimeMark-Importvertrag vorbereiten

**Objective:** FamilyOS kann später vertraute, abgeschlossene TimeMark-Sitzungen sicher und ohne Duplikate als nicht automatisch vergütete Aufgabenzeit importieren.

**Files:**
- Create: `lib/timemark-import.ts`
- Create: `tests/timemark-import.test.ts`
- Modify: `prisma/schema.prisma` (nur falls Task 2 die Modelle nicht vollständig enthält)
- Create: `app/app/settings/timemark/page.tsx` (Verknüpfung nur als UI-Skelett, deaktiviert bis TimeMark-Auth-Vertrag vorhanden ist)

**Step 1: Versionierten, minimalen DTO-Vertrag definieren**

`TimeMarkCompletedSessionV1` enthält mindestens:

```ts
{
  schemaVersion: 1;
  sessionId: string;
  ownerExternalUserId: string;
  kind: "STOPWATCH" | "COUNTDOWN" | "INTERVAL" | "CHESS";
  status: "COMPLETED" | "CANCELLED";
  startedAt: string;
  endedAt: string;
  workedDurationMs: number;
  label?: string;
  timeline: unknown[];
}
```

FamilyOS akzeptiert nur `COMPLETED`, ISO-Zeitpunkte, nichtnegative plausible Dauer und eine erfolgreiche Eigentümerprüfung über eine aktive Verknüpfung. Es vertraut nie einem aus TimeMark gelieferten Geldbetrag.

**Step 2: Failing Tests schreiben**

- Keine aktive Verknüpfung → Import abgelehnt.
- Abweichender externer Eigentümer → abgelehnt.
- Laufende/pausierte/cancelled Sitzung → abgelehnt.
- Wiederholte `sessionId` → idempotent, keine zweite Zeitbuchung.
- Ein Erwachsener muss vor dem finalen Import eine FamilyOS-Aufgabeninstanz wählen.
- Import erzeugt eine `TaskTimeEntry` mit Quelle `TIMEMARK_IMPORT`, aber keine Freigabe und keine Gutschrift.

**Step 3: Parser und Import-Vorschau implementieren**

- Zu diesem Zeitpunkt keine Netzwerkabfrage und kein Token.
- Die spätere TimeMark-Seite bzw. ein signierter Export liefert das DTO in einen manuellen Vorschaufluss.
- Eltern sehen Label, Dauer, Start/Ende und Zielaufgabe, bestätigen ausdrücklich; danach bleibt der normale FamilyOS-Prüf-/Lohnprozess maßgeblich.

**Step 4: Dokumentation für TimeMark-Handoff schreiben**

Create: `.hermes/plans/references/timemark-familyos-import-contract-v1.md`

Sie enthält DTO, Eigentümer-/Einwilligungsanforderung, manuelle Importsemantik, Idempotenzschlüssel, Fehlercodes und die klare Regel: TimeMark darf niemals FamilyOS-Geld, eine laufende FamilyOS-Zeit oder eine automatische Auszahlung erzeugen.

**Step 5: Tests und Commit**

```bash
npm test -- tests/timemark-import.test.ts
git add lib/timemark-import.ts tests/timemark-import.test.ts app/app/settings/timemark .hermes/plans/references/timemark-familyos-import-contract-v1.md
 git commit -m "feat: prepare manual TimeMark task-time import"
```

### Task 9: Vollständige Regression, Migrationstatus und Sicherheitsreview

**Objective:** Zeit, Geld, Rollen und Importgrenzen sind als zusammenhängender Ablauf belegt.

**Files:**
- Modify: `README.md` oder bestehende FamilyOS-Betriebsdokumentation
- Modify: betroffene Tests aus Tasks 1–8

**Step 1: Dokumentieren**

Dokumentiere Lohnmodelle, Mitternachtsstop, Korrektur-/Ausgleichsbuchungen, negative Salden, Barauszahlungsrundung, keine IBAN-Speicherung und den ausschließlich manuellen TimeMark-Import.

**Step 2: Vollständige Verifikation ausführen**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npx prisma validate
npx prisma migrate status
git diff --check
```

**Step 3: Browser-E2E-Smoke mit einem isolierten Testhaushalt**

Nach dem Test alle erzeugten Zeitbuchungen, Kontozeilen, Auszahlungsanträge und Importbelege wieder entfernen und deren Nichtvorhandensein verifizieren.

**Step 4: Zwei Reviews und sauberer Commit**

- Erst Spec-Compliance-Review: Rollen, Geldbuchungen, Snapshots, Zeitberechnung, Import-/Tenantgrenzen.
- Danach Code-Quality-Review: Transaktionen, Fehlerpfade, UI-Mobile, Testabdeckung.
- Nur eigene Dateien explizit stagen; keine fremden Worktree-Änderungen übernehmen.

## Risiken und Schutzmaßnahmen

- **Geld und nachträgliche Korrektur:** Keine Mutation bereits gebuchter Kontozeilen; ausschließlich Differenz-/Ausgleichsbuchungen.
- **Timer-Manipulation:** Keine Clientdauer und kein Clientbetrag als Wahrheit speichern; die API akzeptiert nur diskrete Aktionen und berechnet auf dem Server.
- **Mitternacht:** Der Scheduler ist maßgeblich; ein Browser kann nicht zuverlässig für den Stop verantwortlich sein.
- **Vorlagenänderungen:** Vergütung, Schätzung und Zeitregeln der bereits erzeugten Instanz bleiben Snapshots.
- **TimeMark:** Bis ein gemeinsamer Auth-/Exportvertrag im TimeMark-Chat umgesetzt und geprüft ist, bleibt die FamilyOS-Verknüpfung deaktiviert. Keine Credentials oder Hintergrundsynchronisation in FamilyOS einführen.
- **Mehrpersonen-/Freigaberennen:** Freigabe, Kontozeile, Saldo und Auszahlungsreservierung müssen jeweils in einer Datenbanktransaktion erfolgen.

## Noch benötigter Input vor Umsetzung

Keiner für den beschriebenen Scope. Der konkrete TimeMark-Auth-/Exportmechanismus wird erst im TimeMark-Projekt festgelegt; FamilyOS implementiert bis dahin nur den klar abgegrenzten Importvertrag und deaktivierte Verknüpfungsoberfläche.
