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
    end
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
