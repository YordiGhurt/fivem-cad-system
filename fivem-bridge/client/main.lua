-- CAD Bridge Client Script
-- QBCore Integration

local QBCore = exports['qb-core']:GetCoreObject()
local cadOpen = false

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
    cb({})
end)

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
