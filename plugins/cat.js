// Generated by CoffeeScript 1.12.6
var misc;

misc = require('../lib/misc');

module.exports = {
  pattern: /!(кот|киса|cat)$/,
  name: 'Cats',
  onMsg: function(msg, safe) {
    return this.sendImageFromUrl(msg, 'http://thecatapi.com/api/images/get');
  }
};
