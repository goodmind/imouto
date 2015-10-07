// Generated by CoffeeScript 1.9.1
var keys, logger, misc, search;

logger = require('winston');

misc = require('../lib/misc');

keys = {};

search = function(txt, rsz) {
  if (rsz == null) {
    rsz = 1;
  }
  return misc.get("http://ajax.googleapis.com/ajax/services/search/images", {
    qs: {
      v: '1.0',
      hl: 'ru',
      rsz: rsz,
      imgsz: 'small|medium|large|xlarge',
      safe: 'active',
      q: txt
    },
    json: true
  }).then(function(res) {
    return res.responseData.results;
  });
};

module.exports = {
  name: 'Images',
  pattern: /!(покажи|пик|img|pic) (.+)/,
  isConf: true,
  onMsg: function(msg, safe) {
    var key, res, txt;
    txt = msg.match[2];
    key = txt + "$$" + msg.chat.id;
    if (!(key in keys)) {
      keys[key] = true;
      res = search(txt);
    } else {
      logger.info("Repeated: " + key);
      res = search(txt, 8);
    }
    return safe(res).then((function(_this) {
      return function(results) {
        var result, url;
        if (results.length === 0) {
          return msg.reply("Ничего не найдено!");
        } else {
          result = misc.randomChoice(results);
          url = result.unescapedUrl;
          return _this.sendImageFromUrl(msg, url, {
            reply: msg.id
          });
        }
      };
    })(this));
  },
  onError: function(msg) {
    return msg.send('Поиск не удался...');
  }
};
