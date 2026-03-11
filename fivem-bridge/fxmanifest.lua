fx_version 'cerulean'
game 'gta5'

name 'fivem-cad-bridge'
description 'CAD System Bridge for QBCore'
version '1.0.0'
author 'CAD System'

shared_scripts {
    'config.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/main.lua'
}

client_scripts {
    'client/main.lua'
}

dependencies {
    'oxmysql',
    'qb-core',
}
