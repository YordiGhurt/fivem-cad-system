-- CAD Bridge Client Script
-- QBCore Integration

local QBCore = exports['qb-core']:GetCoreObject()
local cadOpen = false
local cadUnitCallsign = nil

-- CAD-Interface öffnen
local function openCAD()
    if cadOpen then return end
    cadOpen = true
    SendNUIMessage({
        action = 'open',
        url = Config.CAD_URL .. '/dashboard',
    })
    SetNuiFocus(true, true)
end

-- CAD-Interface schließen
local function closeCAD()
    if not cadOpen then return end
    cadOpen = false
    SendNUIMessage({ action = 'close' })
    SetNuiFocus(false, false)
end

-- Befehl: /cad - CAD öffnen
RegisterCommand('cad', function()
    if cadOpen then
        closeCAD()
    else
        openCAD()
    end
end, false)

-- F6-Taste zum Öffnen/Schließen des CAD
RegisterKeyMapping('cad', 'CAD System öffnen/schließen', 'keyboard', 'F6')

-- Befehl: /setstatus - Einheitenstatus setzen
RegisterCommand('setstatus', function(source, args)
    local status = args[1] and string.upper(args[1]) or nil
    local validStatuses = {
        AVAILABLE = true,
        BUSY = true,
        OFFDUTY = true,
        ONSCENE = true,
        ENROUTE = true,
        BREAK = true,
    }

    if not status or not validStatuses[status] then
        QBCore.Functions.Notify('Gültige Status: AVAILABLE, BUSY, OFFDUTY, ONSCENE, ENROUTE, BREAK', 'error')
        return
    end

    -- Einheit-ID aus LocalStorage (muss vorher gesetzt worden sein)
    local unitId = LocalStorage and LocalStorage.cadUnitId or nil
    if not unitId then
        QBCore.Functions.Notify('Keine CAD-Einheit aktiv. Bitte zuerst im CAD anmelden.', 'error')
        return
    end

    TriggerServerEvent('cad:server:updateUnitStatus', unitId, status)
    QBCore.Functions.Notify('Status geändert: ' .. status, 'success')
end, false)

-- Befehl: /flagcar - Fahrzeug markieren
RegisterCommand('flagcar', function(source, args)
    local plate = args[1]
    local reason = table.concat(args, ' ', 2)

    if not plate then
        QBCore.Functions.Notify('Verwendung: /flagcar [KENNZEICHEN] [GRUND]', 'error')
        return
    end

    TriggerServerEvent('cad:server:flagVehicle', plate, false, reason)
end, false)

-- Befehl: /stolen - Fahrzeug als gestohlen melden
RegisterCommand('stolen', function(source, args)
    local plate = args[1]
    if not plate then
        QBCore.Functions.Notify('Verwendung: /stolen [KENNZEICHEN]', 'error')
        return
    end

    TriggerServerEvent('cad:server:flagVehicle', plate, true, 'Als gestohlen gemeldet')
    QBCore.Functions.Notify('Fahrzeug ' .. plate .. ' als gestohlen gemeldet', 'success')
end, false)

-- Panic-Button: /panic oder F9
local panicCooldown = false

local function triggerPanic()
    if panicCooldown then
        QBCore.Functions.Notify('Panic Button ist im Cooldown (30 Sekunden)', 'error')
        return
    end

    local callsign = (cadUnitCallsign or 'UNBEKANNT')
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local location = string.format('X:%.1f Y:%.1f Z:%.1f', coords.x, coords.y, coords.z)

    TriggerServerEvent('cad:server:panicButton', callsign, location)
    QBCore.Functions.Notify('🚨 PANIC BUTTON ausgelöst! Hilfe wurde angefordert.', 'error', 8000)

    panicCooldown = true
    SetTimeout(30000, function()
        panicCooldown = false
    end)
end

RegisterCommand('panic', function()
    triggerPanic()
end, false)

RegisterKeyMapping('panic', 'CAD Panic Button', 'keyboard', 'F9')

-- Event: Panic Alert empfangen (von anderen Einheiten)
RegisterNetEvent('cad:client:panicAlert', function(callsign, location)
    QBCore.Functions.Notify('🚨 PANIC! Officer ' .. callsign .. ' braucht Hilfe! Ort: ' .. location, 'error', 10000)
end)

-- Event: Einheitenstatus-Update empfangen
RegisterNetEvent('cad:client:unitStatusUpdate', function(payload)
    if payload and payload.callsign and payload.status then
        QBCore.Functions.Notify('[CAD] Einheit ' .. payload.callsign .. ': ' .. payload.status, 'primary', 4000)
    end
end)

-- Event: Neuer Einsatz erstellt
RegisterNetEvent('cad:client:incidentCreated', function(payload)
    if payload then
        QBCore.Functions.Notify('🚨 Neuer Einsatz: ' .. (payload.type or 'Unbekannt') .. ' - ' .. (payload.location or ''), 'warning', 6000)
    end
end)

-- Event: Einsatz aktualisiert
RegisterNetEvent('cad:client:incidentUpdated', function(payload)
    if payload and payload.caseNumber then
        QBCore.Functions.Notify('[CAD] Einsatz ' .. payload.caseNumber .. ' aktualisiert', 'primary', 4000)
    end
end)

-- Event: CAD-Benachrichtigung anzeigen
RegisterNetEvent('cad:client:showNotification', function(payload)
    if payload and payload.message then
        QBCore.Functions.Notify('[CAD] ' .. payload.message, 'primary', 5000)
    end
end)

-- NUI-Callback: CAD schließen
RegisterNUICallback('closeCAD', function(data, cb)
    closeCAD()
    cb({})
end)

-- NUI-Callback: Unit-ID speichern
RegisterNUICallback('setUnitId', function(data, cb)
    if data and data.unitId then
        LocalStorage = LocalStorage or {}
        LocalStorage.cadUnitId = data.unitId
    end
    if data and data.callsign then
        cadUnitCallsign = data.callsign
    end
    cb({})
end)

-- NUI-Callback: Waffen synchronisieren
RegisterNUICallback('syncWeapons', function(data, cb)
    TriggerServerEvent('cad:server:syncWeapons')
    cb({})
end)

-- Befehl: /syncweapons – Waffen manuell synchronisieren
RegisterCommand('syncweapons', function()
    TriggerServerEvent('cad:server:syncWeapons')
    QBCore.Functions.Notify('Waffen werden synchronisiert...', 'primary')
end, false)

-- Befehl: /syncvehicles – Fahrzeuge manuell synchronisieren
RegisterCommand('syncvehicles', function()
    TriggerServerEvent('cad:server:syncVehicles')
    QBCore.Functions.Notify('Fahrzeuge werden synchronisiert...', 'primary')
end, false)

-- ESC schließt CAD
CreateThread(function()
    while true do
        Wait(0)
        if cadOpen and IsControlJustPressed(0, 200) then -- ESC
            closeCAD()
        end
    end
end)

print('[CAD Bridge] Client-Script geladen')

