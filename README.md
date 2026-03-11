# FiveM CAD System

Ein vollständiges **Computer-Aided Dispatch (CAD) System** für FiveM / QBCore-Server, gebaut mit Next.js 14, Prisma und PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748)

---

## Funktionen

- 🚔 **Dispatch-Übersicht** – Echtzeit-Übersicht aller aktiven Einsätze und Einheiten
- 🚨 **Einsatzverwaltung** – Erstellen, Bearbeiten, Schließen von Einsätzen mit Prioritäten (P1–P5)
- 📻 **Einheitenverwaltung** – Status-Tracking (AVAILABLE, BUSY, ONSCENE, ENROUTE, BREAK, OFFDUTY)
- 👤 **Bürgerdatenbank** – Vollständige Bürgerprofile mit Fahrzeugen und Waffen
- 🚗 **Fahrzeugregister** – Kennzeichen, Modell, Eigentümer, Diebstahlmarkierung
- ⚠️ **Haftbefehle** – Ausstellung und Verwaltung von Haftbefehlen
- 📄 **Berichte** – Erstellung und PDF-Export von Einsatzberichten
- 🏢 **Organisationen** – LSPD, EMS, LSFD, DOJ und benutzerdefinierte Organisationen
- 👑 **Admin-Panel** – Benutzerverwaltung und Systemübersicht
- 🔌 **FiveM-Bridge** – Lua-Skript für QBCore-Integration
- 🔒 **Authentifizierung** – NextAuth.js mit JWT-Sessions
- 🐳 **Docker-Support** – Vollständige Docker Compose Konfiguration

---

## Technologie-Stack

| Technologie | Version | Verwendung |
|---|---|---|
| Next.js | 14.2 | App Router, Server Components, API Routes |
| TypeScript | 5.5 | Typsicherheit |
| Prisma | 5.14 | ORM / Datenbankzugriff |
| PostgreSQL | 16 | Datenbank |
| NextAuth.js | 4.24 | Authentifizierung |
| Tailwind CSS | 3.4 | Styling |
| Socket.IO | 4.7 | Echtzeit-Kommunikation |
| Puppeteer | 22 | PDF-Generierung |
| Zod | 3.23 | Schema-Validierung |

---

## Voraussetzungen

- **Node.js** 20+
- **PostgreSQL** 14+ (oder Docker)
- **npm** oder **yarn**

---

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/dein-user/fivem-cad-system.git
cd fivem-cad-system
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeite `.env` und passe die Werte an:

```env
DATABASE_URL="postgresql://cad_user:cad_password@localhost:5432/cad_db"
NEXTAUTH_SECRET="ein-sehr-geheimes-passwort-aendern"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
CAD_API_KEY="dein-sicherer-api-key"
```

### 4. Datenbank einrichten

```bash
# Migrationen ausführen
npm run prisma:migrate

# Seed-Daten einfügen (Demo-Daten)
npm run prisma:seed
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist unter **http://localhost:3000** erreichbar.

**Standard-Anmeldedaten:**
- Benutzername: `admin`
- Passwort: `admin123`

---

## Docker

### Mit Docker Compose starten

```bash
# .env-Datei erstellen
cp .env.example .env

# Container starten
docker compose up -d

# Migrationen und Seed ausführen
docker compose exec cad-app npx prisma migrate deploy
docker compose exec cad-app npx prisma db seed
```

Die Anwendung ist unter **http://localhost:3000** erreichbar.

### Container stoppen

```bash
docker compose down
```

### Daten löschen

```bash
docker compose down -v
```

---

## FiveM-Bridge

Die FiveM-Bridge ermöglicht die direkte Integration mit QBCore.

### Installation

1. Kopiere den Ordner `fivem-bridge` in das `resources`-Verzeichnis deines FiveM-Servers
2. Benenne ihn um zu `fivem-cad-bridge`
3. Bearbeite `config.lua`:

```lua
Config.CAD_URL = "https://dein-cad-server.de"  -- URL deiner CAD-Instanz
Config.API_KEY = "dein-api-key"                  -- Muss mit CAD_API_KEY in .env übereinstimmen
```

4. Füge `ensure fivem-cad-bridge` zu deiner `server.cfg` hinzu

### Verfügbare Befehle (Client)

| Befehl | Funktion |
|--------|----------|
| `/cad` oder `F6` | CAD-Interface öffnen/schließen |
| `/setstatus [STATUS]` | Einheitenstatus setzen (AVAILABLE, BUSY, etc.) |
| `/flagcar [KENNZEICHEN] [GRUND]` | Fahrzeug markieren |
| `/stolen [KENNZEICHEN]` | Fahrzeug als gestohlen melden |

### Server-Events

```lua
-- Einsatz erstellen
TriggerServerEvent('cad:server:createIncident', {
    type = 'Bewaffneter Raub',
    description = 'Beschreibung...',
    location = 'Fleeca Bank, Los Santos',
    priority = 1,
    organizationId = 'org-id-hier',
})

-- Fahrzeug markieren
TriggerServerEvent('cad:server:flagVehicle', 'ABCD123', true, 'Gestohlen')
```

---

## FiveM Ingame-Login (Cookie-Konfiguration)

### Lokal / Entwicklung

Damit der automatische Login im FiveM-Ingame-Browser (CEF/Chromium) funktioniert, müssen die Session-Cookies mit kompatiblen Attributen gesetzt werden. Der CEF-Browser speichert Cookies auf `http://`-URLs **nicht**, wenn das `Secure`-Flag gesetzt ist.

Das CAD-System erkennt dies automatisch anhand der `NEXTAUTH_URL`:

| `NEXTAUTH_URL` | `secure` | Verwendung |
|---|---|---|
| `http://localhost:3000` | `false` | Lokale Entwicklung / FiveM lokal |
| `https://dein-cad-server.de` | `true` | Produktion |

Stelle sicher, dass in `.env` die korrekte URL gesetzt ist:

```env
# Lokal:
NEXTAUTH_URL="http://localhost:3000"

# Produktion:
# NEXTAUTH_URL="https://dein-cad-server.de"
```

### Produktion

> ⚠️ **Wichtig:** In der Produktion muss `NEXTAUTH_URL` auf eine `https://`-URL gesetzt sein.
> Nur so wird der Cookie mit `secure: true` gesetzt, was für die Sicherheit zwingend erforderlich ist.
> Außerdem muss der FiveM-Server die CAD-URL über HTTPS erreichen können.

Schritte für Produktion:

1. `NEXTAUTH_URL="https://dein-cad-server.de"` in `.env` setzen
2. `NEXTAUTH_SECRET` auf einen langen, zufälligen Wert setzen
3. SSL-Zertifikat sicherstellen (z. B. via Let's Encrypt / Caddy / nginx)

### Fehlersuche

Falls der Ingame-Login nicht funktioniert:

- Prüfe, ob `NEXTAUTH_URL` exakt mit der URL übereinstimmt, über die das CAD aufgerufen wird
- Prüfe im Server-Log, ob `POST /api/auth/callback/fivem-token` mit `200` antwortet
- Falls danach `GET /api/auth/session` immer `{}` (leer) zurückgibt, liegt ein Cookie-Problem vor → `NEXTAUTH_URL` prüfen
- In FiveM-Konsole (`F8`): `nui_devtools` eingeben, um Chrome DevTools für den Ingame-Browser zu öffnen und Cookies zu inspizieren

---



Alle API-Endpunkte erfordern eine gültige NextAuth-Session (außer `/api/sync/player`).

### Authentifizierung

```
POST /api/auth/signin
```

### Einsätze

```
GET    /api/incidents           – Liste aller Einsätze
POST   /api/incidents           – Neuen Einsatz erstellen
GET    /api/incidents/:id       – Einsatz-Details
PUT    /api/incidents/:id       – Einsatz aktualisieren
DELETE /api/incidents/:id       – Einsatz löschen (Admin/Supervisor)
```

### Einheiten

```
GET    /api/units               – Liste aller Einheiten
POST   /api/units               – Neue Einheit erstellen
GET    /api/units/:id           – Einheit-Details
PUT    /api/units/:id           – Einheit aktualisieren
DELETE /api/units/:id           – Einheit löschen
POST   /api/units/status        – Einheitenstatus aktualisieren
```

### Bürger

```
GET    /api/citizens            – Bürgerliste (mit Suche)
POST   /api/citizens            – Neuen Bürger anlegen
GET    /api/citizens/:id        – Bürger-Details
PUT    /api/citizens/:id        – Bürger aktualisieren
DELETE /api/citizens/:id        – Bürger löschen (Admin)
```

### Fahrzeuge

```
GET    /api/vehicles            – Fahrzeugliste
POST   /api/vehicles            – Fahrzeug registrieren
PUT    /api/vehicles/:id        – Fahrzeug aktualisieren
DELETE /api/vehicles/:id        – Fahrzeug löschen (Admin)
POST   /api/vehicles/flag       – Fahrzeug markieren/als gestohlen melden
```

### Haftbefehle

```
GET    /api/warrants            – Haftbefehlsliste
POST   /api/warrants            – Haftbefehl ausstellen
PUT    /api/warrants/:id        – Haftbefehl aktualisieren
DELETE /api/warrants/:id        – Haftbefehl löschen (Admin/Supervisor)
```

### Berichte

```
GET    /api/reports             – Berichtsliste
POST   /api/reports             – Bericht erstellen
GET    /api/reports/:id         – Bericht-Details
PUT    /api/reports/:id         – Bericht aktualisieren
DELETE /api/reports/:id         – Bericht löschen
POST   /api/reports/:id/pdf     – PDF generieren
```

### Organisationen

```
GET    /api/organizations       – Organisationsliste
POST   /api/organizations       – Organisation erstellen (Admin)
PUT    /api/organizations/:id   – Organisation aktualisieren (Admin)
DELETE /api/organizations/:id   – Organisation löschen (Admin)
```

### FiveM-Sync (API-Key-geschützt)

```
POST   /api/sync/player         – Spieler-Daten synchronisieren
                                  Header: x-api-key: <CAD_API_KEY>
```

---

## Benutzerrollen

| Rolle | Beschreibung |
|-------|-------------|
| `ADMIN` | Vollzugriff, Benutzerverwaltung, Organisationen |
| `SUPERVISOR` | Einsätze löschen, Haftbefehle löschen |
| `OFFICER` | Einsätze erstellen/bearbeiten, Berichte |
| `DISPATCHER` | Dispatch-Übersicht, Einheiten-Status |
| `USER` | Nur-Lesen-Zugriff |

---

## Projektstruktur

```
fivem-cad-system/
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login-Seite
│   │   ├── api/                 # API-Routes
│   │   │   ├── auth/            # NextAuth
│   │   │   ├── incidents/       # Einsatz-API
│   │   │   ├── units/           # Einheiten-API
│   │   │   ├── citizens/        # Bürger-API
│   │   │   ├── vehicles/        # Fahrzeug-API
│   │   │   ├── warrants/        # Haftbefehl-API
│   │   │   ├── reports/         # Berichte-API
│   │   │   ├── organizations/   # Organisations-API
│   │   │   └── sync/            # FiveM-Sync
│   │   └── dashboard/           # Dashboard-Seiten
│   ├── lib/
│   │   ├── auth.ts              # NextAuth-Konfiguration
│   │   ├── prisma.ts            # Prisma-Client
│   │   ├── socket.ts            # Socket.IO
│   │   └── pdf/                 # PDF-Generierung
│   └── types/                   # TypeScript-Typen
├── prisma/
│   ├── schema.prisma            # Datenbankschema
│   └── seed.ts                  # Demo-Daten
├── fivem-bridge/                # FiveM Lua-Bridge
│   ├── fxmanifest.lua
│   ├── config.lua
│   ├── server/main.lua
│   └── client/main.lua
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Sicherheitshinweise

- Ändere `NEXTAUTH_SECRET` in der `.env` Datei unbedingt vor dem Produktiveinsatz
- Ändere das Standard-Admin-Passwort nach der ersten Anmeldung
- Setze einen sicheren `CAD_API_KEY` für die FiveM-Bridge
- Stelle sicher, dass die Datenbank nicht öffentlich zugänglich ist
- Verwende HTTPS in der Produktion

---

## Lizenz

MIT License – Weitere Details in der [LICENSE](LICENSE) Datei.

---

## Beitragen

Pull Requests sind willkommen! Bitte beachte die folgenden Richtlinien:

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/neue-funktion`)
3. Änderungen committen (`git commit -m 'feat: Neue Funktion hinzugefügt'`)
4. Branch pushen (`git push origin feature/neue-funktion`)
5. Pull Request erstellen
