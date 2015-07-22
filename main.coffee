require './lib/polyfills'

logger = require 'winston'

logger.setLevels
    debug: 0
    info: 1
    outMsg: 1
    inMsg: 1
    warn: 2
    error: 3

logger.addColors
    debug: 'gray'
    info: 'white'
    outMsg: 'bold green'
    inMsg: 'green'
    warn: 'bold yellow'
    error: 'bold red'

logger.remove logger.transports.Console
logger.add logger.transports.Console, 
    formatter: ({level, message}) ->
        date = (new Date).toLocaleString()
        text = "[#{date}] #{message}"
        logger.config.colorize level, text
logger.add logger.transports.File,
    json: false
    filename: __dirname + "/logs/" + (new Date).toLocaleDateString() + ".log"
    formatter: ({level, message}) ->
        date = (new Date).toLocaleString()
        "[#{date}] [#{level}] #{message}"

config = require './lib/config'
query = require './lib/query'
tg = require './lib/tg'
Bot = require './bot'

TIMEOUT = 60
isInitialized = false

process.on 'uncaughtException', (err) ->
    logger.error err.stack
    if isInitialized
        logger.warn 'Waiting 30 seconds before retry...'
        setTimeout -> 
            logger.info 'Retrying getUpdates...'
            updateLoop bot
        , 30000

lastUpdate = null
updateLoop = (bot) ->
    args = timeout: TIMEOUT
    if lastUpdate?
        args.offset = lastUpdate + 1
    query('getUpdates', args, timeout: (TIMEOUT + 1) * 1000).then (upd) ->
        if upd.error?
            if !upd.error.startsWith 'Conflict'
                logger.warn 'Waiting 30 seconds before retry...'
                setTimeout -> 
                    logger.info 'Retrying getUpdates...'
                    updateLoop bot
                , 30000
        else
            for u in upd
                #console.log("Received update: " + JSON.stringify(u))
                if not lastUpdate? or u.update_id > lastUpdate
                    lastUpdate = u.update_id
                if u.message?
                    bot.onMessage u.message
            updateLoop(bot)

if not config.options.token
    logger.info("Please set up the configuration file (config/main.config)!")
else
    logger.info("Starting...")
    bot = new Bot()
    bot.sudoList = config.sudoList
    bot.bannedIds = config.bannedIds
    bot.reloadPlugins()
    tg.getInfo().then (info) ->
        config.setUserInfo info
        isInitialized = true
        updateLoop bot