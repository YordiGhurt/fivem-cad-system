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

-- Spieler-Daten synchronisieren
local function syncPlayerToCAD(source)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    local charinfo = Player.PlayerData.charinfo

    if not citizenid or not charinfo then return end

    cadApiPost('/api/sync/player', {
        citizenId = citizenid,
        steamId = GetPlayerIdentifierByType(source, 'steam') or '',
        firstName = charinfo.firstname or '',
        lastName = charinfo.lastname or '',
        dateOfBirth = charinfo.birthdate or '',
        phone = charinfo.phone or '',
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] Spieler synchronisiert: ' .. citizenid)
        else
            print('[CAD Bridge] Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

-- Fahrzeuge synchronisieren
local function syncVehiclesToCAD(source)
    if not Config.SyncVehicles then return end

    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    if not citizenid then return end

    local vehicles = Player.PlayerData.vehicles or {}
    local vehicleList = {}

    for _, vehicle in ipairs(vehicles) do
        table.insert(vehicleList, {
            plate = vehicle.plate or '',
            model = vehicle.vehicle or vehicle.model or 'unknown',
            color = tostring(vehicle.color or '0'),
        })
    end

    cadApiPost('/api/sync/vehicles', {
        citizenId = citizenid,
        vehicles = vehicleList,
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] Fahrzeuge synchronisiert für: ' .. citizenid)
        else
            print('[CAD Bridge] Fahrzeug-Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

-- Waffen synchronisieren
local function syncWeaponsToCAD(source)
    if not Config.SyncWeapons then return end

    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    local citizenid = Player.PlayerData.citizenid
    if not citizenid then return end

    local items = Player.PlayerData.items or {}
    local weaponList = {}

    for _, item in ipairs(items) do
        if item and item.name and string.sub(string.lower(item.name), 1, 7) == 'weapon_' then
            table.insert(weaponList, {
                serialNumber = item.info and item.info.serie or (item.name .. '_' .. citizenid),
                model = item.name,
                licensed = item.info and item.info.licensed or false,
            })
        end
    end

    cadApiPost('/api/sync/weapons', {
        citizenId = citizenid,
        weapons = weaponList,
    }, function(status, response)
        if status == 200 then
            print('[CAD Bridge] Waffen synchronisiert für: ' .. citizenid)
        else
            print('[CAD Bridge] Waffen-Sync-Fehler für ' .. citizenid .. ': ' .. tostring(status))
        end
    end)
end

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
            syncVehiclesToCAD(source)
            syncWeaponsToCAD(source)
        end)
    end
end)

-- Manueller Waffen-Sync (vom Client ausgelöst)
RegisterNetEvent('cad:server:syncWeapons', function()
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end
    syncWeaponsToCAD(source)
end)

-- Manueller Fahrzeug-Sync (vom Client ausgelöst)
RegisterNetEvent('cad:server:syncVehicles', function()
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end
    syncVehiclesToCAD(source)
end)

-- Einheit-Status aktualisieren (von Client-Trigger)
RegisterNetEvent('cad:server:updateUnitStatus', function(unitId, status)
    local source = source
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return end

    PerformHttpRequest(Config.CAD_URL .. '/api/units/status', function(statusCode, responseText)
        if statusCode == 200 then
            print('[CAD Bridge] Unit-Status aktualisiert: ' .. unitId .. ' -> ' .. status)
        end
    end, 'POST', json.encode({
        unitId = unitId,
        status = status,
    }), {
        ['Content-Type'] = 'application/json',
        ['x-api-key'] = Config.API_KEY,
    })
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

print('[CAD Bridge] Server-Script geladen')

