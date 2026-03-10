Config = {}

-- URL zur CAD-Web-App
Config.CAD_URL = "http://localhost:3000"

-- API-Key (muss mit CAD_API_KEY in .env übereinstimmen)
-- WICHTIG: Diesen Wert unbedingt vor dem Produktiveinsatz ändern!
Config.API_KEY = "your-api-key-here"

-- Automatische Synchronisation aktivieren
Config.AutoSync = true

-- Synchronisationsintervall in Millisekunden
Config.SyncInterval = 30000

-- Fahrzeug-Sync aktivieren
Config.SyncVehicles = true

-- Waffen-Sync aktivieren
Config.SyncWeapons = true
