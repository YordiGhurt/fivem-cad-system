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

## Production Deployment (HTTPS mit Apache/KeyHelp)

### Voraussetzungen

- Server mit Docker und Docker Compose
- Apache2 / KeyHelp läuft bereits auf Port 80/443
- DNS A-Record: `cad.bigone1.net` → Server-IP
- SSL-Zertifikat für `cad.bigone1.net` (über KeyHelp/Let's Encrypt)

### 1. Repo klonen und .env anlegen

```bash
git clone https://github.com/YordiGhurt/fivem-cad-system.git
cd fivem-cad-system
cp .env.example .env
```

### 2. .env anpassen

Folgende Werte MÜSSEN geändert werden:

```bash
# Zufälligen Secret generieren:
openssl rand -base64 32
```

Dann in `.env` setzen:
- `POSTGRES_PASSWORD` – sicheres Datenbankpasswort
- `NEXTAUTH_SECRET` – der generierte zufällige String
- `CAD_API_KEY` – beliebiger sicherer API-Key (muss mit FiveM-Bridge übereinstimmen)

### 3. Docker starten

```bash
docker compose up -d
```

Der Container läuft auf `127.0.0.1:3000` (nur intern erreichbar).

### 4. Datenbank migrieren

```bash
docker compose exec cad-app npx prisma migrate deploy
docker compose exec cad-app npx prisma db seed
```

### 5. Apache/KeyHelp konfigurieren

In KeyHelp unter **Erweiterte Direktiven** für die Domain `cad.bigone1.net` folgende Direktiven eintragen (siehe `deploy/apache-vhost.conf`):

```apache
<IfModule mod_proxy.c>
    ProxyPass /.well-known/acme-challenge !
</IfModule>

Alias /.well-known/acme-challenge /home/keyhelp/www/.well-known/acme-challenge

ProxyRequests Off
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/

RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://127.0.0.1:3000/$1" [P,L]
```

> **Hinweis:** Kein `SSLProxyEngine On` nötig – Docker läuft intern über HTTP. Apache übernimmt die SSL-Terminierung.

### 6. FiveM Bridge konfigurieren

In `fivem-bridge/config.lua`:
- `Config.CAD_URL` auf `"https://cad.bigone1.net"` setzen
- `Config.API_KEY` auf denselben Wert wie `CAD_API_KEY` in `.env` setzen

### Warum HTTPS den FiveM-Login-Bug löst

Der FiveM CEF-Browser benötigt `SameSite=None; Secure` Cookies, damit Sessions in iframes funktionieren. Diese Cookie-Flags sind nur mit HTTPS gültig. Mit `NEXTAUTH_URL=https://...` setzt das CAD-System automatisch die korrekten Cookie-Attribute.

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

## FiveM Ingame-Login (Credentials-basiert, empfohlen)

### Warum Credentials-Login statt Token?

Der FiveM-Ingame-Browser (CEF/Chromium) hat bekannte Probleme mit dem Setzen von Cookies nach asynchronen NextAuth-Flows (Token-basierter Login). Die Session wird manchmal nicht korrekt persistiert, was zu Redirect-Schleifen zur Login-Seite führt.

**Die Lösung:** Der Login erfolgt nun direkt mit **Spielername + Bürger-ID** als NextAuth-Credentials. Dies umgeht alle Cookie/JWT-Race-Conditions, da NextAuth den Session-Cookie synchron im selben Request-Zyklus setzt.

### Wie funktioniert der Credentials-Login?

1. Der Spieler öffnet das CAD ingame mit `/cad` oder `F6`
2. Der FiveM-Server liest Spielername (`GetPlayerName`) und Bürger-ID aus QBCore aus
3. Die CAD-URL wird geöffnet: `/auth/fivem?username=<Spielername>&citizenid=<BürgerID>`
4. Die CAD-Seite ruft `signIn('fivem-credentials', { username, password: citizenId })` auf
5. Der Auth-Provider prüft, ob der Benutzer existiert, aktiv ist **und** `user.citizenId === citizenId`
6. Bei Erfolg: Direkter Redirect zum Dashboard – kein Polling nötig

### Auto-Provisioning (Automatische Benutzeranlage)

Spieler werden beim **ersten Ingame-Login automatisch** im CAD angelegt:

- **Benutzername** wird auf den **FiveM-Spielernamen** (`GetPlayerName()`) gesetzt
- **Bürger-ID** wird als `citizenId` gespeichert
- Neue Benutzer erhalten automatisch die Rolle **OFFICER**
- Keine manuelle Anlage im Admin-Panel erforderlich

**Migration bestehender Accounts:** Falls ein Benutzer noch die Bürger-ID als Username eingetragen hat (ältere Anlage), wird der Username beim nächsten Login automatisch auf den korrekten Spielernamen aktualisiert.

### Benutzer einrichten

Dank Auto-Provisioning werden Benutzer beim ersten Ingame-Login automatisch angelegt – eine manuelle Anlage ist nicht mehr erforderlich.

Für manuell angelegte Benutzer (z. B. Admin-Accounts):

- **Benutzername** = FiveM-Spielername (exakt so wie `GetPlayerName()` ihn zurückgibt, z. B. `Max_Mustermann`)
  > ⚠️ **Groß-/Kleinschreibung beachten!** Der Benutzername muss exakt übereinstimmen.
  > Um den genauen Spielernamen zu prüfen, kannst du in der FiveM-Serverkonsole `status` eingeben
  > oder im Server-Log nach `[CAD Bridge] Spieler synchronisiert:` suchen.
- **Bürger-ID** = QBCore citizenid des Spielers (z. B. `GWF43187`)

### Benutzerverwaltung im Admin-Panel

Unter **Admin → Benutzerverwaltung** kannst du alle Benutzer einsehen und bearbeiten:

- **Edit-Button** (Stift-Symbol) öffnet das Bearbeitungs-Modal für den Benutzer
- Bearbeitbare Felder: **Benutzername**, **E-Mail**, **Rolle**, **Organisation**, **Status** (aktiv/inaktiv)
- Über den Edit-Button können auch Benutzer korrigiert werden, bei denen noch die Bürger-ID als Username eingetragen ist

Der Bürger-ID-Wert wird im Feld „Bürger-ID" des Benutzerprofils gespeichert.

> 💡 **Hinweis zur Sicherheit:** Die Bürger-ID wird als Login-Merkmal verwendet und im Klartext verglichen.
> Sie ist kein klassisches Passwort – der Zugang ist auf Spieler beschränkt, die ihre Bürger-ID kennen.
> Für maximale Sicherheit sollte der CAD-Server nicht öffentlich zugänglich sein.

### Cookie-Konfiguration

Damit der Session-Cookie im CEF-Browser korrekt gesetzt wird, muss `NEXTAUTH_URL` in `.env` korrekt gesetzt sein:

| `NEXTAUTH_URL` | `secure` | Verwendung |
|---|---|---|
| `http://localhost:3000` | `false` | Lokale Entwicklung / FiveM lokal |
| `https://dein-cad-server.de` | `true` | Produktion |

```env
# Lokal:
NEXTAUTH_URL="http://localhost:3000"

# Produktion:
# NEXTAUTH_URL="https://dein-cad-server.de"
```

### Fehlersuche

Falls der Ingame-Login nicht funktioniert:

- Prüfe, ob der CAD-Benutzer existiert und aktiv ist (`active = true`)
- Prüfe, ob der Benutzername **exakt** mit `GetPlayerName()` übereinstimmt (Groß-/Kleinschreibung beachten)
- Prüfe, ob die Bürger-ID im CAD-Profil mit der QBCore citizenid übereinstimmt
- Beim ersten Login wird der Benutzer automatisch angelegt – falls dies nicht passiert, prüfe die Server-Logs
- Falls ein alter Benutzer noch die Bürger-ID als Username hat: Entweder einmal einloggen (automatische Korrektur) oder im Admin-Panel manuell über den Edit-Button korrigieren
- Prüfe, ob `NEXTAUTH_URL` exakt mit der URL übereinstimmt, über die das CAD aufgerufen wird
- In FiveM-Konsole (`F8`): `nui_devtools` eingeben, um Chrome DevTools für den Ingame-Browser zu öffnen

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
