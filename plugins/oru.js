// Generated by CoffeeScript 1.12.6
var _unused;

module.exports = {};

_unused = {
  name: 'Oru',
  init: function() {
    return this.pattern = this.fixPattern(/\bору\b/);
  },
  onMsg: function(msg) {
    return msg.reply("Не ори.");
  }
};
