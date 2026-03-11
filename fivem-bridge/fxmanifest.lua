fx_version 'cerulean'
game 'gta5'

name 'fivem-cad-bridge'
description 'CAD System Bridge for QBCore'
version '1.0.0'
author 'CAD System'

ui_page 'html/index.html'

files {
    'html/index.html'
}

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
