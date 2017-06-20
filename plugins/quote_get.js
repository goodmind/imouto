// Generated by CoffeeScript 1.12.6
var CB_DELAY, config, formatDate, keyboard, keyboard2, logger, misc, msgCache, pq, quotes, sanitizeHtml,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

logger = require('winston');

pq = require('../lib/promise');

quotes = require('../lib/quotes');

msgCache = require('../lib/msg_cache');

misc = require('../lib/misc');

config = require('../lib/config');

CB_DELAY = 1500;

formatDate = function(date) {
  var d, m, y;
  d = date.getDate();
  if (d < 10) {
    d = "0" + d;
  }
  m = date.getMonth() + 1;
  if (m < 10) {
    m = "0" + m;
  }
  y = date.getFullYear() % 100;
  return d + "." + m + "." + y;
};

sanitizeHtml = function(html) {
  return html.replace(/\>/g, '&gt;').replace(/\</g, '&lt;').replace(/\&/g, '&amp;');
};

keyboard = [
  [
    {
      text: quotes.THUMBS_UP,
      callback_data: 'up'
    }, {
      text: quotes.THUMBS_DOWN,
      callback_data: 'down'
    }
  ], [
    {
      text: 'media',
      callback_data: 'media'
    }, {
      text: '<',
      callback_data: 'prev'
    }, {
      text: '?',
      callback_data: 'random'
    }, {
      text: '>',
      callback_data: 'next'
    }, {
      text: '>|',
      callback_data: 'last'
    }, {
      text: '[x]',
      callback_data: 'close'
    }
  ]
];

keyboard2 = [
  [
    {
      text: quotes.THUMBS_UP,
      callback_data: 'up'
    }, {
      text: quotes.THUMBS_DOWN,
      callback_data: 'down'
    }
  ]
];

module.exports = {
  name: 'Quotes (get)',
  pattern: /!(q|!q|qq|ц|!ц|цц|цитата|quote|удали|del|delete|stats)(?:\s+(.+))?$/,
  init: function() {
    quotes.init();
    return this.sudoList = config.toIdList(config.options.quotes_sudo);
  },
  onMsg: function(msg) {
    var cmd, hdr, inlineMode, num, onlyPositive, ownerId, queryInfo, quote, quoteSet, reply, txt;
    cmd = msg.match[1].toLowerCase();
    if (cmd === 'удали' || cmd === 'del' || cmd === 'delete') {
      if (!this.checkSudo(msg)) {
        return;
      }
      num = misc.tryParseInt(msg.match[2]);
      if (num == null) {
        return;
      }
      quote = quotes.getByNumber(num);
      if (quote == null) {
        msg.reply("Цитата с номером " + num + " не найдена.");
        return;
      }
      if (quote.posterId !== msg.from.id && !this.bot.isSudo(msg)) {
        msg.reply("Нельзя удалять чужие цитаты.");
        return;
      }
      quotes.delQuote(num);
      msg.reply("Цитата " + num + " удалена.");
      return;
    }
    if (msg.reply_to_message != null) {
      reply = msg.reply_to_message;
      if (reply.forward_from != null) {
        ownerId = reply.forward_from.id;
      } else {
        ownerId = reply.from.id;
      }
    } else {
      ownerId = null;
    }
    if (cmd === 'stats') {
      msg.send(quotes.getStats(ownerId, msg.match[2]));
      return;
    }
    inlineMode = cmd !== '!q' && cmd !== '!ц';
    quotes.updateUsers();
    queryInfo = null;
    if (msg.match[2] != null) {
      txt = msg.match[2].trim();
      num = null;
      if (txt.endsWith('+')) {
        num = misc.tryParseInt(txt.substr(0, txt.length - 1));
        if (num != null) {
          queryInfo = "Начиная с №" + num;
          quoteSet = quotes.getByNumberPlusAll(num);
          quote = misc.randomChoice(quoteSet);
        }
      }
      if (num == null) {
        num = misc.tryParseInt(txt);
        if (num != null) {
          quoteSet = quotes.getRandomAll();
          quote = quotes.getByNumber(num);
        } else {
          queryInfo = "Содержит: '" + (msg.match[2].trim()) + "'";
          if (ownerId != null) {
            queryInfo += " Автор: " + (quotes.getUserNameById(ownerId));
          }
          quoteSet = quotes.getByTextAll(msg.match[2].trim(), ownerId);
          quote = misc.randomChoice(quoteSet);
        }
      }
    } else {
      if (ownerId != null) {
        queryInfo = "Автор: " + (quotes.getUserNameById(ownerId));
        quoteSet = quotes.getByOwnerIdAll(ownerId);
        quote = misc.randomChoice(quoteSet);
      } else {
        onlyPositive = cmd === 'qq' || cmd === 'цц';
        if (onlyPositive) {
          queryInfo = "Только с положительным рейтингом";
        }
        quoteSet = quotes.getRandomAll({
          onlyPositive: onlyPositive
        });
        quote = misc.randomChoice(quoteSet);
      }
    }
    if (quote != null) {
      if (inlineMode) {
        return this.sendInline(msg, quote, quoteSet, queryInfo);
      } else {
        hdr = this.getQuoteHeader(quote, false);
        quotes.setLastQuote(msg.chat.id, quote.num);
        return msg.send(hdr, {
          parseMode: 'HTML'
        }).then((function(_this) {
          return function() {
            var buf, fwdFunc, kekerName, ref;
            if (quote.version >= 5) {
              fwdFunc = function(msgIndex) {
                if (msgIndex < quote.messages.length) {
                  return msg.forward(quote.messages[msgIndex].id, quote.messages[msgIndex].chat_id).then(function() {
                    return fwdFunc(msgIndex + 1);
                  });
                }
              };
              return fwdFunc(0);
            } else {
              if (quote.version >= 3) {
                fwdFunc = function(msgIndex) {
                  var buf, kekerName, message, ref;
                  if (msgIndex < quote.messages.length) {
                    message = quote.messages[msgIndex];
                    kekerName = (ref = message.saved_name) != null ? ref : message.sender_name;
                    buf = "<i>" + (kekerName.replace('_', ' ')) + "</i>\n";
                    if (message.text != null) {
                      buf += message.text;
                      return msg.send(buf, {
                        parseMode: 'HTML'
                      }).then(function() {
                        return fwdFunc(msgIndex + 1);
                      });
                    } else {
                      return fwdFunc(msgIndex + 1);
                    }
                  }
                };
                return fwdFunc(0);
              } else {
                kekerName = (ref = quote.saved_name) != null ? ref : quote.sender_name;
                buf = '';
                if (quote.reply_text != null) {
                  buf += '&gt; ' + quote.reply_text.replace(/\n/g, '\n> ') + "\n\n";
                }
                buf += "<i>" + (kekerName.replace('_', ' ')) + "</i>\n";
                buf += quote.text;
                return msg.send(buf, {
                  parseMode: 'HTML'
                });
              }
            }
          };
        })(this));
      }
    } else {
      return msg.reply('Цитата не найдена :(');
    }
  },
  getQuoteHeader: function(quote, inlineMode) {
    var _last, _savedNames, hdr, i, len, rating, ratingStr, savedName, savedNames, sn;
    hdr = "<b>Цитата №" + quote.num + "</b>";
    if (!inlineMode) {
      if (quote.version <= 2) {
        savedName = quote.saved_name;
      } else {
        _savedNames = quote.messages.map(function(mm) {
          return mm.saved_name;
        }).filter(function(n) {
          return n != null;
        });
        _last = null;
        savedNames = [];
        for (i = 0, len = _savedNames.length; i < len; i++) {
          sn = _savedNames[i];
          if (sn !== _last) {
            _last = sn;
            savedNames.push(sn);
          }
        }
        savedName = savedNames.join(", ");
      }
    }
    if (quote.version < 5) {
      hdr += " (архив)";
    } else {
      if ((savedName != null) && savedName !== "") {
        hdr += " (" + savedName + ")";
      }
    }
    rating = quotes.getRating(quote.num);
    if (rating > 0) {
      ratingStr = "+" + rating;
    } else {
      ratingStr = "" + rating;
    }
    if (quote.date != null) {
      hdr += ", сохранена " + (formatDate(new Date(quote.date)));
    }
    if (quote.posterName != null) {
      hdr += ", от <i>" + quote.posterName + "</i>";
    }
    hdr += "\nРейтинг цитаты: <b>[ " + ratingStr + " ]</b>";
    if (!inlineMode) {
      hdr += " " + quotes.THUMBS_UP + " /Opy_" + quote.num + " " + quotes.THUMBS_DOWN + " /He_opu_" + quote.num;
    }
    return hdr;
  },
  getQuoteText: function(quote) {
    var buf, i, kekerName, len, message, parts, ref, ref1, ref2;
    if (quote.version >= 3) {
      parts = [];
      ref = quote.messages;
      for (i = 0, len = ref.length; i < len; i++) {
        message = ref[i];
        kekerName = sanitizeHtml((ref1 = message.saved_name) != null ? ref1 : message.sender_name);
        buf = "<i>" + (kekerName.replace('_', ' ')) + "</i>\n";
        if (message.text != null) {
          buf += sanitizeHtml(message.text);
        } else {
          buf += '[media]';
        }
        parts.push(buf);
      }
      return parts.join('\n\n');
    } else {
      kekerName = sanitizeHtml((ref2 = quote.saved_name) != null ? ref2 : quote.sender_name);
      buf = '';
      if (quote.reply_text != null) {
        buf += '&gt; ' + sanitizeHtml(quote.reply_text.replace(/\n/g, '\n&gt; ')) + "\n\n";
      }
      buf += "<i>" + (kekerName.replace('_', ' ')) + "</i>\n";
      buf += sanitizeHtml(quote.text);
      return buf;
    }
  },
  getQuoteFull: function(arg) {
    var prefix, queryInfo, quote, quoteSet;
    quote = arg.quote, quoteSet = arg.quoteSet, queryInfo = arg.queryInfo;
    prefix = "<code>Всего: " + quoteSet.length + "</code>";
    if (queryInfo != null) {
      prefix = "<code>" + queryInfo + "</code>\n" + prefix;
    }
    return prefix + "\n\n" + (this.getQuoteHeader(quote, true)) + "\n\n" + (this.getQuoteText(quote));
  },
  sendInline: function(msg, quote, quoteSet, queryInfo) {
    var context;
    context = {
      quote: quote,
      quoteSet: quoteSet,
      index: quoteSet.indexOf(quote),
      queryInfo: queryInfo,
      mediaForwarded: {},
      keyboard: keyboard
    };
    return msg.send(this.getQuoteFull(context), {
      parseMode: 'HTML',
      preview: false,
      inlineKeyboard: keyboard,
      callback: (function(_this) {
        return function(cb, msg) {
          return _this.onCallback(context, cb, msg);
        };
      })(this)
    });
  },
  onCallback: function(context, cb, msg) {
    var index, now;
    if (!this.bot.isSudo(cb)) {
      now = Date.now();
      if ((this.lastClick != null) && now - this.lastClick < CB_DELAY) {
        cb.answer('Слишком много запросов, подождите 3 секунды...');
        return;
      }
      this.lastClick = now;
    }
    context.msg = msg;
    switch (cb.data) {
      case 'up':
        this.vote(context, cb, true);
        break;
      case 'down':
        this.vote(context, cb, false);
        break;
      case 'prev':
        if (context.index > 0) {
          context.index -= 1;
        } else {
          context.index = context.quoteSet.length - 1;
        }
        context.quote = context.quoteSet[context.index];
        this.updateInline(context);
        cb.answer('');
        break;
      case 'next':
        if (context.index + 1 < context.quoteSet.length) {
          context.index += 1;
        } else {
          context.index = 0;
        }
        context.quote = context.quoteSet[context.index];
        this.updateInline(context);
        cb.answer('');
        break;
      case 'random':
        index = misc.random(context.quoteSet.length);
        if (index !== context.index) {
          context.index = index;
          context.quote = context.quoteSet[context.index];
          this.updateInline(context);
        }
        cb.answer('');
        break;
      case 'last':
        index = context.quoteSet.length - 1;
        if (index !== context.index) {
          context.index = index;
          context.quote = context.quoteSet[context.index];
          this.updateInline(context);
        }
        cb.answer('');
        break;
      case 'media':
        if (!context.mediaForwarded[context.index]) {
          context.mediaForwarded[context.index] = true;
          this.forwardMedia(msg, context.quote);
        }
        cb.answer('');
        break;
      case 'close':
        context.keyboard = keyboard2;
        this.updateInline(context, true);
        cb.answer('');
        break;
      default:
        logger.warn('unknown data');
    }
  },
  forwardMedia: function(msg, quote) {
    var fwdFunc;
    if (quote.version >= 5) {
      fwdFunc = (function(_this) {
        return function(msgIndex) {
          var message, results;
          results = [];
          while (msgIndex < quote.messages.length) {
            message = quote.messages[msgIndex];
            if (message.text == null) {
              msg.forward(message.id, message.chat_id).then(function() {
                return fwdFunc(msgIndex + 1);
              });
              break;
            } else {
              results.push(msgIndex += 1);
            }
          }
          return results;
        };
      })(this);
      fwdFunc(0);
    }
  },
  vote: function(context, cb, isUp) {
    var num, rating;
    num = context.quote.num;
    if (quotes.vote(num, null, cb.from.id, isUp) != null) {
      rating = quotes.getRating(num);
      if (rating > 0) {
        rating = "+" + rating;
      }
      cb.answer("Ваш голос " + (isUp ? quotes.THUMBS_UP : quotes.THUMBS_DOWN) + " учтён. Рейтинг цитаты №" + num + ": [ " + rating + " ]");
      this.updateInline(context, true);
    }
  },
  updateInline: function(context, force) {
    if (force == null) {
      force = false;
    }
    if (!force && context.quoteSet.length <= 1) {
      return;
    }
    context.msg.edit(this.getQuoteFull(context), {
      parseMode: 'HTML',
      preview: false,
      inlineKeyboard: context.keyboard
    }).then((function(_this) {
      return function(res) {
        if ((res != null ? res.message_id : void 0) == null) {
          return _this.lastClick = Date.now() + 10000;
        }
      };
    })(this));
  },
  isSudo: function(msg) {
    var ref;
    return this.bot.isSudo(msg) || (ref = msg.from.id, indexOf.call(this.sudoList, ref) >= 0);
  }
};
