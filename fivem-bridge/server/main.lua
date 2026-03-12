-- CAD Bridge Server Script
-- QBCore Integration

local QBCore = exports['qb-core']:GetCoreObject()

-- Hilfsfunktion: HTTP-POST an CAD API
local function cadApiPost(endpoint, data, callback)
    local url = Config.CAD_URL .. endpoint
    local payload = json.encode(data)

    PerformHttpRequest(url, function(statusCode, responseText, headers)
        if callback then
            callback(statusCode, responseText)
        end
    end, 'POST', payload, {
        ['Content-Type'] = 'application/json',
        ['x-api-key'] = Config.API_KEY,
    })
end

-- Hilfsfunktion: HTTP-GET an CAD API
local function cadApiGet(endpoint, callback)
    local url = Config.CAD_URL .. endpoint

    PerformHttpRequest(url, function(statusCode, responseText, headers)
        if callback then
            callback(statusCode, responseText)
        end
    end, 'GET', '', {
        ['Content-Type'] = 'application/json',
        ['x-api-key'] = Config.API_KEY,
    })
end

-- Jobs aus QBCore.Shared.Jobs lesen und ans CAD senden
-- Nur Jobs mit mehr als einem Rang werden synchronisiert
local function syncJobsToCAD()
    local jobs = QBCore.Shared.Jobs
    if not jobs then
        print('[CAD Bridge] QBCore.Shared.Jobs nicht gefunden')
        return
    end

    local jobList = {}

    for jobName, jobData in pairs(jobs) do
        -- Zähle Ränge
        local gradeCount = 0
        for _ in pairs(jobData.grades or {}) do
            gradeCount = gradeCount + 1
        end

        -- Nur Jobs mit mehr als einem Rang synchronisieren
        if gradeCount >= 2 then
            local grades = {}
            for gradeKey, gradeData in pairs(jobData.grades or {}) do
                local level = tonumber(gradeKey) or 0
                table.insert(grades, {
                    level = level,
                    name = gradeData.name or ('Rang ' .. gradeKey),
                    isBoss = gradeData.isboss == true,
                })
            end

            -- Ränge nach Level sortieren
            table.sort(grades, function(a, b) return a.level < b.level end)

            table.insert(jobList, {
                name = jobName,
                label = jobData.label or jobName,
                type = jobData.type or nil,
                grades = grades,
            })
        end
    end

    if #jobList == 0 then
        print('[CAD Bridge] Keine geeigneten Jobs zum Synchronisieren gefunden')
        return
    end

    cadApiPost('/api/sync/jobs', {
        jobs = jobList,
    }, function(status, response)
        if status == 200 then
            local ok, data = pcall(json.decode, response)
            if ok and data then
                print('[CAD Bridge] Jobs synchronisiert: ' .. tostring(data.synced) .. ' Organisationen')
            else
                print('[CAD Bridge] Jobs synchronisiert')
            end
        else
            print('[CAD Bridge] Jobs-Sync-Fehler: ' .. tostring(status))
        end
    end)
end

-- Fahrzeuge aus der Datenbank laden und synchronisieren (QBCore: player_vehicles Tabelle)
local function syncVehiclesFromDB(citizenid)
    if not Config.SyncVehicles then return end
    if not citizenid or citizenid == '' then return end

    exports['oxmysql']:execute('SELECT plate, vehicle, mods FROM player_vehicles WHERE citizenid = ?', {citizenid}, function(result)
        if result and #result > 0 then
            local vehicleList = {}
            for _, row in ipairs(result) do
                -- `vehicle` ist direkt der Modellname (kein JSON)
                -- `mods` ist ein separates JSON mit Fahrzeugmodifikationen
                local color = '0'
                if row.mods and row.mods ~= '{}' then
                    local ok, mods = pcall(json.decode, row.mods)
                    if ok and mods and type(mods) == 'table' then
                        color = tostring(mods.color1 or mods.color or 0)
                    end
                end

                table.insert(vehicleList, {
                    plate = row.plate,
                    model = row.vehicle or 'Unbekannt',
                    color = color,
                })
            end

            if #vehicleList == 0 then return end

            cadApiPost('/api/sync/vehicles', {
                citizenId = citizenid,
                vehicles = vehicleList,
            }, function(status, response)
                if status == 200 then
                    print('[CAD Bridge] ' .. #vehicleList .. ' Fahrzeuge (DB) synchronisiert für: ' .. citizenid)
                else
                    print('[CAD Bridge] Fahrzeug-Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
                end
            end)
        else
            print('[CAD Bridge] Keine Fahrzeuge in DB gefunden für: ' .. citizenid)
        end
    end)
end

-- Fahrzeuge synchronisieren (Fallback: PlayerData.vehicles für ältere QBCore-Versionen)
-- In neueren QBCore-Versionen sind Fahrzeuge in der player_vehicles DB-Tabelle gespeichert
local function syncVehiclesToCAD(citizenid, vehicles)
    if not Config.SyncVehicles then return end
    if not vehicles then return end

    local vehicleList = {}

    for plate, vehicleData in pairs(vehicles) do
        table.insert(vehicleList, {
            plate = plate,
            model = vehicleData.vehicle or vehicleData.model or 'Unbekannt',
            color = tostring(vehicleData.color1 or 0),
        })
    end

    if #vehicleList == 0 then return end

    cadApiPost('/api/sync/vehicles', {
        citizenId = citizenid,
        vehicles = vehicleList,
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] ' .. #vehicleList .. ' Fahrzeuge synchronisiert für: ' .. citizenid)
        else
            print('[CAD Bridge] Fahrzeug-Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

-- Waffen synchronisieren
-- In QBCore sind Items als Key-Value-Pairs gespeichert (Key = Itemname)
local function syncWeaponsToCAD(citizenid, items)
    if not Config.SyncWeapons then return end
    if not items then return end

    local weaponList = {}

    for itemName, itemData in pairs(items) do
        if string.find(itemName, '^weapon_') then
            table.insert(weaponList, {
                serialNumber = itemData.info and itemData.info.serie or (citizenid .. '_' .. itemName),
                model = itemName or itemData.label or 'Unbekannt',
                licensed = itemData.info and itemData.info.licensed or false,
            })
        end
    end

    if #weaponList == 0 then return end

    cadApiPost('/api/sync/weapons', {
        citizenId = citizenid,
        weapons = weaponList,
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] ' .. #weaponList .. ' Waffen synchronisiert für: ' .. citizenid)
        else
            print('[CAD Bridge] Waffen-Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

-- Spieler-Daten synchronisieren (inkl. metadata.licences)
local function syncPlayerToCAD(source)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    local charinfo = Player.PlayerData.charinfo

    if not citizenid or not charinfo then return end

    -- Lizenzen aus metadata lesen
    local licences = nil
    local metadata = Player.PlayerData.metadata
    if metadata and metadata.licences then
        licences = metadata.licences
    end

    cadApiPost('/api/sync/player', {
        citizenId = citizenid,
        steamId = GetPlayerIdentifierByType(source, 'steam') or '',
        firstName = charinfo.firstname or '',
        lastName = charinfo.lastname or '',
        dateOfBirth = charinfo.birthdate or '',
        phone = charinfo.phone or '',
        licences = licences,
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] Spieler synchronisiert: ' .. citizenid)

            -- Fahrzeuge aus DB laden (zuverlässiger als PlayerData.vehicles)
            syncVehiclesFromDB(citizenid)

            -- Waffen aus QBCore laden und synchronisieren
            local items = Player.PlayerData.items
            if items then
                syncWeaponsToCAD(citizenid, items)
            end
        else
            print('[CAD Bridge] Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

-- Login-Daten (Spielername + Bürger-ID) für CAD-Credentials-Login anfordern
-- Kein API-Aufruf nötig – die Daten liegen lokal im QBCore vor.
RegisterNetEvent('cad:server:requestLogin', function()
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    local job = Player.PlayerData.job

    if not citizenid or not job then
        TriggerClientEvent('cad:client:openCAD', source, nil, nil, 'Kein CAD-Zugang – keine Spielerdaten gefunden.')
        return
    end

    -- Prüfe ob der Job überhaupt existiert (kein harter Grade-Count-Check mehr)
    local jobData = QBCore.Shared.Jobs[job.name]
    if not jobData then
        TriggerClientEvent('cad:client:openCAD', source, nil, nil, 'Kein CAD-Zugang – unbekannter Job.')
        return
    end

    -- Spielername direkt verwenden (entspricht dem CAD-Benutzernamen)
    local username = GetPlayerName(source)
    TriggerClientEvent('cad:client:openCAD', source, username, citizenid, nil)
end)

-- Event: Spieler betritt Server
AddEventHandler('playerConnecting', function()
    local source = source
    SetTimeout(5000, function()
        syncPlayerToCAD(source)
    end)
end)

-- Event: QBCore Spieler geladen
AddEventHandler('QBCore:Server:PlayerLoaded', function(Player)
    local source = Player.PlayerData.source
    if source then
        SetTimeout(2000, function()
            syncPlayerToCAD(source)
        end)
        SetTimeout(4000, function()
            local citizenid = Player.PlayerData.citizenid
            if citizenid then
                -- Fahrzeuge aus DB laden (zuverlässiger als PlayerData.vehicles)
                syncVehiclesFromDB(citizenid)
                syncWeaponsToCAD(citizenid, Player.PlayerData.items)
            end
        end)
    end
end)

-- Manueller Waffen-Sync (vom Client ausgelöst)
RegisterNetEvent('cad:server:syncWeapons', function()
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end
    local citizenid = Player.PlayerData.citizenid
    if citizenid then
        syncWeaponsToCAD(citizenid, Player.PlayerData.items)
    end
end)

-- Manueller Fahrzeug-Sync (vom Client ausgelöst) – verwendet DB-Lookup
RegisterNetEvent('cad:server:syncVehicles', function()
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end
    local citizenid = Player.PlayerData.citizenid
    if citizenid then
        syncVehiclesFromDB(citizenid)
    end
end)

-- Einheit-Status aktualisieren (von Client-Trigger)
RegisterNetEvent('cad:server:updateUnitStatus', function(unitId, status)
    local source = source

    -- Security: verify the unit belongs to this player before updating
    cadApiGet('/api/units/' .. tostring(unitId), function(statusCode, responseText)
        if statusCode ~= 200 then
            print('[CAD Bridge] WARNUNG: Unit-Status-Update verweigert – Unit nicht gefunden: ' .. tostring(unitId) .. ' (Quelle: ' .. tostring(source) .. ')')
            return
        end

        local ok, unitData = pcall(json.decode, responseText)
        if not ok or not unitData or not unitData.data then
            print('[CAD Bridge] WARNUNG: Unit-Status-Update verweigert – ungültige Antwort für Unit: ' .. tostring(unitId))
            return
        end

        -- Get the player's steam ID and compare with the unit owner's steamId
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then
            print('[CAD Bridge] WARNUNG: Unit-Status-Update verweigert – Spielerdaten nicht verfügbar für Quelle ' .. tostring(source))
            return
        end

        local citizenid = Player.PlayerData.citizenid
        local unitCitizenId = unitData.data.user and unitData.data.user.citizenId

        -- Deny if the unit has an owner but we cannot verify identity
        if not unitCitizenId then
            print('[CAD Bridge] WARNUNG: Unit-Status-Update verweigert – Unit ' .. tostring(unitId) .. ' hat keinen verifizierbaren Besitzer')
            return
        end

        if citizenid ~= unitCitizenId then
            print('[CAD Bridge] WARNUNG: Unit-Status-Update verweigert – Besitzerkonflikt für Unit ' .. tostring(unitId) .. ' (Spieler: ' .. tostring(citizenid) .. ', Unit-Besitzer: ' .. tostring(unitCitizenId) .. ')')
            return
        end

        PerformHttpRequest(Config.CAD_URL .. '/api/units/status', function(sc, responseText)
            if sc == 200 then
                print('[CAD Bridge] Unit-Status aktualisiert: ' .. unitId .. ' -> ' .. status)
            else
                print('[CAD Bridge] Unit-Status Fehler: ' .. tostring(sc) .. ' - ' .. tostring(responseText))
            end
        end, 'POST', json.encode({
            unitId = unitId,
            status = status,
        }), {
            ['Content-Type'] = 'application/json',
            ['x-api-key'] = Config.API_KEY,
        })
    end)
end)

-- Fahrzeug als gestohlen markieren
RegisterNetEvent('cad:server:flagVehicle', function(plate, stolen, reason)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    cadApiPost('/api/vehicles/flag', {
        plate = plate,
        flagged = true,
        stolen = stolen,
        flagReason = reason or '',
    }, function(statusCode, responseText)
        if statusCode == 200 then
            TriggerClientEvent('QBCore:Notify', source, 'Fahrzeug wurde im CAD markiert', 'success')
        else
            TriggerClientEvent('QBCore:Notify', source, 'CAD-Fehler beim Markieren', 'error')
        end
    end)
end)

-- Neuen Einsatz erstellen
RegisterNetEvent('cad:server:createIncident', function(data)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    cadApiPost('/api/incidents', {
        type = data.type or 'Unbekannt',
        description = data.description or '',
        location = data.location or 'Unbekannt',
        priority = data.priority or 3,
        organizationId = data.organizationId or '',
    }, function(statusCode, responseText)
        if statusCode == 201 then
            local incident = json.decode(responseText)
            TriggerClientEvent('QBCore:Notify', source, 'Einsatz erstellt: ' .. (incident.data and incident.data.caseNumber or ''), 'success')
        else
            TriggerClientEvent('QBCore:Notify', source, 'Fehler beim Erstellen des Einsatzes', 'error')
        end
    end)
end)

-- Panic Button vom Client
RegisterNetEvent('cad:server:panicButton', function(callsign, location)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local steamId = GetPlayerIdentifierByType(source, 'steam') or ''
    local orgId = ''

    -- Alle Disponenten über den Panic Button informieren
    TriggerClientEvent('cad:client:panicAlert', -1, callsign, location)

    cadApiPost('/api/fivem/panic', {
        steamId = steamId,
        unitCallsign = callsign,
        location = location or 'Unbekannt',
    }, function(statusCode, responseText)
        if statusCode == 200 then
            print('[CAD Bridge] Panic Button gesendet für: ' .. callsign)
        else
            print('[CAD Bridge] Panic-Fehler: ' .. tostring(statusCode))
        end
    end)
end)

-- Event-Polling: CAD → FiveM Push-Events abholen
CreateThread(function()
    while true do
        Wait(Config.SyncInterval)

        cadApiGet('/api/fivem/poll', function(statusCode, responseText)
            if statusCode ~= 200 or not responseText then return end

            local ok, data = pcall(json.decode, responseText)
            if not ok or not data or not data.events then return end

            for _, event in ipairs(data.events) do
                print('[CAD Bridge] Event empfangen: ' .. event.type)

                if event.type == 'unit_status_update' then
                    TriggerClientEvent('cad:client:unitStatusUpdate', -1, event.payload)

                elseif event.type == 'incident_created' then
                    TriggerClientEvent('cad:client:incidentCreated', -1, event.payload)

                elseif event.type == 'incident_updated' then
                    TriggerClientEvent('cad:client:incidentUpdated', -1, event.payload)

                elseif event.type == 'notification' then
                    -- Zeige Notification an alle Spieler
                    TriggerClientEvent('cad:client:showNotification', -1, event.payload)
                end
            end
        end)
    end
end)

-- Periodische Synchronisierung aller Online-Spieler
if Config.AutoSync then
    CreateThread(function()
        while true do
            Wait(Config.SyncInterval)
            local players = GetPlayers()
            for _, playerId in ipairs(players) do
                syncPlayerToCAD(tonumber(playerId))
            end
        end
    end)
end

-- Jobs beim Serverstart synchronisieren
AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        -- Kurz warten damit QBCore vollständig geladen ist
        SetTimeout(5000, function()
            print('[CAD Bridge] Starte Jobs-Synchronisierung...')
            syncJobsToCAD()
        end)
    end
end)

-- Jobs bei txAdmin Server-Neustart synchronisieren
AddEventHandler('txAdmin:serverRestarted', function()
    SetTimeout(5000, function()
        print('[CAD Bridge] txAdmin Neustart – Starte Jobs-Synchronisierung...')
        syncJobsToCAD()
    end)
end)

print('[CAD Bridge] Server-Script geladen')

-- Event: Spieler verlässt Server → Einheit auf OFFDUTY setzen
AddEventHandler('playerDropped', function(reason)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    if not citizenid then return end

    print('[CAD Bridge] Spieler ' .. citizenid .. ' hat den Server verlassen (' .. reason .. ') – setze Einheit auf OFFDUTY')

    cadApiPost('/api/fivem/unit-offduty', {
        citizenId = citizenid,
    }, function(statusCode, responseText)
        if statusCode == 200 then
            print('[CAD Bridge] Einheit von ' .. citizenid .. ' auf OFFDUTY gesetzt')
        else
            print('[CAD Bridge] Fehler beim OFFDUTY-Setzen für ' .. citizenid .. ': ' .. tostring(statusCode))
        end
    end)
end)

-- Event: Einheit einem Einsatz zuweisen (von Client)
RegisterNetEvent('cad:server:assignUnit', function(unitId, caseNumber)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    cadApiPost('/api/fivem/assign-unit', {
        unitId = unitId,
        caseNumber = caseNumber,
    }, function(statusCode, responseText)
        if statusCode == 200 then
            TriggerClientEvent('QBCore:Notify', source, 'Einheit dem Einsatz ' .. caseNumber .. ' zugewiesen', 'success')
        else
            TriggerClientEvent('QBCore:Notify', source, 'Fehler: Einsatz nicht gefunden oder bereits abgeschlossen', 'error')
        end
    end)
end)

-- GPS-Positionen aller Spieler senden (nur wenn AutoSync aktiv)
CreateThread(function()
    while true do
        Wait(Config.SyncInterval or 5000)
        if Config.AutoSync then
            local units = {}
            local players = GetPlayers()
            for _, playerId in ipairs(players) do
                local Player = QBCore.Functions.GetPlayer(tonumber(playerId))
                if Player then
                    local ped = GetPlayerPed(tonumber(playerId))
                    if ped and ped ~= 0 then
                        local coords = GetEntityCoords(ped)
                        local citizenid = Player.PlayerData.citizenid or ''
                        table.insert(units, {
                            citizenId = citizenid,
                            x = coords.x,
                            y = coords.y,
                            z = coords.z,
                        })
                    end
                end
            end
            if #units > 0 then
                cadApiPost('/api/fivem/gps', { units = units }, nil)
            end
        end
    end
end)
