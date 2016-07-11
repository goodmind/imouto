// Generated by CoffeeScript 1.10.0
(function() {
  var getJson, misc;

  misc = require('../lib/misc');

  getJson = function(url) {
    return misc.get(url, {
      json: true
    });
  };

  module.exports = {
    pattern: /!qr (.+)/,
    name: 'QR',
    onMsg: function(msg, safe) {
      return this.sendImageFromUrl(msg, 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=' + encodeURIComponent(msg.match[1]));
    }
  };

}).call(this);
