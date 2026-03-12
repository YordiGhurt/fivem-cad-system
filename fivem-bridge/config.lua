Config = {}

-- URL zur CAD-Web-App (Production)
Config.CAD_URL = "https://cad.bigone1.net"

-- API-Key (muss mit CAD_API_KEY in .env übereinstimmen)
-- WICHTIG: Diesen Wert unbedingt ändern und mit .env synchronisieren!
Config.API_KEY = "your-api-key-here"

-- Automatische Synchronisation aktivieren
Config.AutoSync = true

-- Synchronisationsintervall in Millisekunden
Config.SyncInterval = 30000

-- Fahrzeug-Sync aktivieren
Config.SyncVehicles = true

-- Waffen-Sync aktivieren
Config.SyncWeapons = true
