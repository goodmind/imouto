// Generated by CoffeeScript 1.9.1
var misc;

misc = require('../lib/misc');

module.exports = {
  name: 'Dice Roll',
  pattern: /!(roll|ролл|кубик)(?:\s+(d)?(\d+)\s*(?:(d|-)?\s*(\d+))?\s*)?$/,
  onMsg: function(msg) {
    var ref;
    if (msg.match[2] === 'd') {
      if ((msg.match[3] != null) && (msg.match[4] == null) && (msg.match[5] == null)) {
        this.rollDice(msg, 1, misc.tryParseInt(msg.match[3]));
      }
      return;
    }
    if (msg.match[3] == null) {
      return this.rollDice(msg, 1, 20);
    } else if (((ref = msg.match[4]) != null ? ref.toLowerCase() : void 0) === 'd') {
      return this.rollDice(msg, misc.tryParseInt(msg.match[3]), misc.tryParseInt(msg.match[5]));
    } else if (msg.match[5] != null) {
      return this.rollRandom(msg, misc.tryParseInt(msg.match[3]), misc.tryParseInt(msg.match[5]));
    } else {
      return this.rollRandom(msg, 1, misc.tryParseInt(msg.match[3]));
    }
  },
  rollDice: function(msg, num, faces) {
    var d, dices, i, j, len, sum, text;
    if ((num != null) && num > 0 && (faces != null) && faces > 0) {
      if (num > 100) {
        msg.reply("Слишком много кубиков! У меня глаза разбегаются...");
        return;
      }
      dices = (function() {
        var j, ref, results;
        results = [];
        for (i = j = 0, ref = num; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          results.push(this.rnd(1, faces));
        }
        return results;
      }).call(this);
      sum = 0;
      for (j = 0, len = dices.length; j < len; j++) {
        d = dices[j];
        sum += d;
      }
      if (num > 1) {
        text = (dices.join(' + ')) + " = " + sum + " (" + num + "d" + faces + ")";
      } else {
        if (sum <= 20) {
          this.sendStickerFromFile(msg, misc.dataFn("dice/" + sum + ".webp"), {
            reply: msg.message_id
          });
          return;
        }
        text = sum + " (d" + faces + ")";
      }
      return msg.reply(text);
    }
  },
  rollRandom: function(msg, a, b) {
    if ((a != null) && (b != null) && a < b) {
      return msg.reply((this.rnd(a, b)) + " (" + a + "-" + b + ")");
    }
  },
  rnd: function(a, b) {
    return a + misc.random(b - a + 1);
  }
};
