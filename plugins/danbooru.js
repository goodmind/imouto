// Generated by CoffeeScript 1.9.1
var misc, posts;

misc = require('../lib/misc');

posts = function(q) {
  var options;
  options = {
    json: true,
    qs: {
      limit: 32
    }
  };
  if (q != null) {
    options.qs.tags = q;
  }
  return misc.get("http://danbooru.donmai.us/posts.json", options);
};

module.exports = {
  name: 'Danbooru',
  pattern: /!(няша|nyasha)(?:\s+(.+))?/,
  isConf: true,
  onMsg: function(msg, safe) {
    var q;
    q = msg.match[2];
    return safe(posts(q)).then((function(_this) {
      return function(ps) {
        var p, url;
        if (ps.length === 0) {
          return msg.send("Ничего не найдено...");
        } else {
          p = misc.randomChoice(ps);
          if (p.large_file_url != null) {
            url = "http://danbooru.donmai.us" + p.large_file_url;
          } else {
            url = p.source;
          }
          return _this.sendImageFromUrl(msg, url);
        }
      };
    })(this));
  },
  onError: function(msg) {
    return msg.send("Рано тебе еще такое смотреть!");
  }
};