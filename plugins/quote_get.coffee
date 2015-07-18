pq = require '../lib/promise'
quotes = require '../lib/quotes'
msgCache = require '../lib/msg_cache'
misc = require '../lib/misc'

module.exports =
    name: 'Quotes (get)'
    pattern: /!(цитата|quote|удали|stats)(?:\s+(.+))?$/

    init: ->
        quotes.init()

    onMsg: (msg) ->
        if msg.match[1].toLowerCase() == 'удали'
            if !@checkSudo(msg)
                return
            num = misc.tryParseInt(msg.match[2])
            if not num?
                return
            quote = quotes.getByNumber(num)
            if not quote?
                msg.reply("Цитата с номером #{num} не найдена.")
                return
            if quote.posterId != msg.from.id and not @bot.isSudo(msg)
                msg.reply("Нельзя удалять чужие цитаты.")
                return
            quotes.delQuote(num)
            msg.reply("Цитата #{num} удалена.")
            return
        if msg.match[1].toLowerCase() == 'stats'
            msg.send(quotes.getStats())
            return
        quotes.updateUsers()
        if msg.reply_to_message?
            reply = msg.reply_to_message
            if reply.forward_from?
                ownerId = reply.forward_from.id
            else
                ownerId = reply.from.id
        else
            ownerId = null
        if msg.match[2]?
            txt = msg.match[2].trim()
            num = null
            if txt.endsWith('+')
                num = misc.tryParseInt(txt.substr(0, txt.length - 1))
                if num?
                    quote = quotes.getByNumberPlus(num)
            if not num?
                num = misc.tryParseInt(txt)
                if num?
                    quote = quotes.getByNumber(num)
                else
                    quote = quotes.getByText(msg.match[2].trim(), ownerId)
        else
            if ownerId?
                quote = quotes.getByOwnerId(ownerId)
            else
                quote = quotes.getRandom()
        if quote?
            hdr = "Цитата №#{quote.num}"
            if quote.version <= 2
                savedName = quote.saved_name
            else
                savedName = quote.messages.map((mm) -> mm.saved_name).filter((n) -> n?).join(", ")
            if savedName? and savedName != ""
                hdr += " (#{savedName})" 
            msg.send(hdr).then ->
                if quote.version? 
                    if quote.version == 2
                        if quote.reply_id?
                            replyP = msg.forward(quote.reply_id, quote.reply_chat_id)
                        else
                            replyP = pq.resolved()
                        replyP.then ->
                            msg.forward(quote.id, quote.chat_id)
                    else if quote.version >= 3
                        fwdFunc = (msgIndex) ->
                            if msgIndex < quote.messages.length
                                msg.forward(quote.messages[msgIndex].id, quote.messages[msgIndex].chat_id).then ->
                                    fwdFunc(msgIndex + 1)
                        fwdFunc(0)
                else
                    buf = "#{quote.sender_name.replace('_', ' ')}:\n\n"
                    if quote.reply_text?
                        buf += '> ' + quote.reply_text.replace(/\n/g, '\n> ') + "\n"
                    buf += quote.text
                    msg.send(buf)
        else
            msg.reply('Цитата не найдена :(')