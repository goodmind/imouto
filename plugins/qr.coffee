config = require '../lib/config'
misc = require '../lib/misc'

getJson = (url) ->
    misc.get url, json: true

module.exports =
    pattern: /!qr (.+)/
    name: 'QR'

    onMsg: (msg, safe) ->
        @sendImageFromUrl msg, 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=' + encodeURIComponent(msg.match[1])