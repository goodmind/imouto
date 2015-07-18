// Generated by CoffeeScript 1.9.1
var Bot, Plugin, fs, logger, misc, msgCache, tg,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

fs = require('fs');

logger = require('winston');

misc = require('./lib/misc');

tg = require('./lib/tg');

msgCache = require('./lib/msg_cache');

Plugin = require('./plugin');

module.exports = Bot = (function() {
  function Bot() {
    this.plugins = [];
    this.sudoList = [];
    this.bannedIds = [];
  }

  Bot.prototype.onMessage = function(msg) {
    var e, i, len, plugin, ref, ref1, ref2;
    msgCache.add(msg);
    this.logMessage(msg);
    if (!this.isValidMsg(msg)) {
      return;
    }
    this.extendMsg(msg);
    if ((ref = msg.from.id, indexOf.call(this.bannedIds, ref) >= 0) || (!this.isSudo(msg) && (ref1 = msg.chat.id, indexOf.call(this.bannedIds, ref1) >= 0))) {
      return;
    }
    ref2 = this.plugins;
    for (i = 0, len = ref2.length; i < len; i++) {
      plugin = ref2[i];
      try {
        if (msg.forward_from && !plugin.isAcceptFwd) {
          continue;
        }
        if (plugin.isAcceptMsg(msg)) {
          if (!plugin.isPrivileged || plugin.checkSudo(msg)) {
            if (plugin.isConf && (msg.chat.title == null) && !plugin.isSudo(msg)) {
              msg.reply("Эта команда только для конференций. Извини!");
            } else {
              plugin._onMsg(msg);
            }
          }
          break;
        }
      } catch (_error) {
        e = _error;
        logger.error(e.stack);
      }
    }
  };

  Bot.prototype.logMessage = function(msg) {
    var buf, date;
    buf = [];
    date = new Date(msg.date * 1000);
    buf.push("[" + (date.toLocaleTimeString()) + "]");
    if (msg.chat.title != null) {
      buf.push("(" + msg.chat.id + ")" + msg.chat.title);
    }
    buf.push("(" + msg.from.id + ")" + (misc.fullName(msg.from)));
    buf.push(">>>");
    if (msg.text != null) {
      buf.push(msg.text);
    } else {
      buf.push("(no text)");
    }
    return logger.inMsg(buf.join(" "));
  };

  Bot.prototype.extendMsg = function(msg) {
    msg.send = function(text, options) {
      var args;
      if (options == null) {
        options = {};
      }
      args = {
        chat_id: this.chat.id,
        text: text
      };
      if (options.reply != null) {
        args.reply_to_message_id = options.reply;
      }
      if (options.preview != null) {
        args.disable_web_page_preview = !options.preview;
      }
      return tg.sendMessage(args);
    };
    msg.reply = function(text, options) {
      if (options == null) {
        options = {};
      }
      options.reply = this.message_id;
      return this.send(text, options);
    };
    msg.sendPhoto = function(photo, options) {
      var args;
      if (options == null) {
        options = {};
      }
      args = {
        chat_id: this.chat.id,
        photo: photo
      };
      if (options.reply != null) {
        args.reply_to_message_id = options.reply;
      }
      if (options.caption != null) {
        args.caption = options.caption;
      }
      return tg.sendPhoto(args);
    };
    msg.forward = function(msg_id, from_chat_id) {
      var args;
      args = {
        chat_id: this.chat.id,
        from_chat_id: from_chat_id,
        message_id: msg_id
      };
      return tg.forwardMessage(args);
    };
    msg.sendAudio = function(audio, options) {
      var args;
      if (options == null) {
        options = {};
      }
      args = {
        chat_id: this.chat.id,
        audio: {
          value: audio,
          options: {
            contentType: 'audio/ogg',
            filename: 'temp.ogg'
          }
        }
      };
      return tg.sendAudio(args);
    };
  };

  Bot.prototype.reloadPlugins = function() {
    var _fn, data, e, files, fn, i, k, len, pl, results, v;
    logger.info("Reloading plugins...");
    this.plugins = [];
    files = fs.readdirSync(__dirname + '/plugins').filter(function(fn) {
      return fn.endsWith('.js');
    });
    results = [];
    for (i = 0, len = files.length; i < len; i++) {
      _fn = files[i];
      fn = './plugins/' + _fn;
      try {
        data = require(fn);
        if (data.name != null) {
          pl = new Plugin(this);
          for (k in data) {
            v = data[k];
            pl[k] = v;
          }
          pl._init();
          results.push(this.plugins.push(pl));
        } else {
          results.push(logger.warn("Skipped: " + _fn));
        }
      } catch (_error) {
        e = _error;
        logger.warn("Error loading: " + _fn);
        results.push(logger.error(e.stack));
      }
    }
    return results;
  };

  Bot.prototype.isValidMsg = function(msg) {
    return msg.from.id !== 777000;
  };

  Bot.prototype.isSudo = function(msg) {
    var ref;
    return ref = msg.from.id, indexOf.call(this.sudoList, ref) >= 0;
  };

  Bot.prototype.trigger = function(msg, text) {
    var e, i, len, plugin, ref, results;
    ref = this.plugins;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      plugin = ref[i];
      try {
        if (plugin.matchPattern(msg, text)) {
          if (!plugin.isPrivileged || plugin.checkSudo(msg)) {
            if (plugin.isConf && (msg.chat.title == null) && !plugin.isSudo(msg)) {
              results.push(msg.reply("Эта команда только для конференций. Извини!"));
            } else {
              results.push(plugin._onMsg(msg));
            }
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      } catch (_error) {
        e = _error;
        results.push(logger.error(e.stack));
      }
    }
    return results;
  };

  return Bot;

})();