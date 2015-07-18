fs = require 'fs'
logger = require 'winston'

misc = require './lib/misc'
tg = require './lib/tg'
msgCache = require './lib/msg_cache'
Plugin = require './plugin'

module.exports = class Bot
    constructor: ->
        @plugins = []
        @sudoList = []
        @bannedIds = []

    onMessage: (msg) ->
        msgCache.add(msg)
        @logMessage(msg)
        if !@isValidMsg msg
            return
        @extendMsg msg
        if msg.from.id in @bannedIds or (not @isSudo(msg) and msg.chat.id in @bannedIds)
            return
        # if msg.text == '!!r' && @isSudo(msg)
        #     @reloadPlugins()
        #     msg.send 'Перезагрузила'
        #     return
        for plugin in @plugins
            try
                if msg.forward_from and not plugin.isAcceptFwd
                    continue
                if plugin.isAcceptMsg(msg)
                    if not plugin.isPrivileged or plugin.checkSudo(msg)
                        if plugin.isConf and not msg.chat.title? and not plugin.isSudo(msg)
                            msg.reply "Эта команда только для конференций. Извини!"
                        else
                            plugin._onMsg msg
                    break
            catch e
                logger.error e.stack
        return

    logMessage: (msg) ->
        buf = []
        date = new Date(msg.date * 1000)
        buf.push "[#{date.toLocaleTimeString()}]"
        if msg.chat.title?
            buf.push "(#{msg.chat.id})#{msg.chat.title}"
        buf.push "(#{msg.from.id})#{misc.fullName(msg.from)}"
        buf.push ">>>"
        if msg.text?
            buf.push msg.text
        else
            buf.push "(no text)"
        logger.inMsg buf.join(" ")

    extendMsg: (msg) ->
        msg.send = (text, options = {}) ->
            args =
                chat_id: @chat.id
                text: text
            if options.reply?
                args.reply_to_message_id = options.reply
            if options.preview?
                args.disable_web_page_preview = !options.preview
            tg.sendMessage args
        msg.reply = (text, options = {}) ->
            options.reply = @message_id
            @send text, options
        msg.sendPhoto = (photo, options = {}) ->
            args =
                chat_id: @chat.id
                photo: photo
            if options.reply?
                args.reply_to_message_id = options.reply
            if options.caption?
                args.caption = options.caption
            tg.sendPhoto args
        msg.forward = (msg_id, from_chat_id) ->
            args =
                chat_id: @chat.id
                from_chat_id: from_chat_id
                message_id: msg_id
            tg.forwardMessage args
        msg.sendAudio = (audio, options = {}) ->
            args =
                chat_id: @chat.id
                audio:
                    value: audio
                    options:
                        contentType: 'audio/ogg'
                        filename: 'temp.ogg'
            tg.sendAudio args

        return

    reloadPlugins: ->
        logger.info("Reloading plugins...")
        @plugins = []
        files = fs.readdirSync(__dirname + '/plugins').filter (fn) -> fn.endsWith('.js')
        for _fn in files
            fn = './plugins/' + _fn
            try
                data = require fn
                #src = fs.readFileSync fn, encoding: 'utf8'
                #fun = new Function 'require', 'plugin', src
                #fun require, (data) =>
                if data.name?
                    pl = new Plugin(this)
                    for k, v of data
                        pl[k] = v
                    pl._init()
                    @plugins.push pl
                else
                    logger.warn "Skipped: #{_fn}"
            catch e
                logger.warn "Error loading: #{_fn}"
                logger.error e.stack

    isValidMsg: (msg) ->
        msg.from.id != 777000

    isSudo: (msg) ->
        msg.from.id in @sudoList

    trigger: (msg, text) ->
        for plugin in @plugins
            try
                if plugin.matchPattern(msg, text)
                    if not plugin.isPrivileged or plugin.checkSudo(msg)
                        if plugin.isConf and not msg.chat.title? and not plugin.isSudo(msg)
                            msg.reply "Эта команда только для конференций. Извини!"
                        else
                            plugin._onMsg msg
            catch e
                logger.error e.stack