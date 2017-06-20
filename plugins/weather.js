// Generated by CoffeeScript 1.12.6
var cities, logger, weather_command;

weather_command = require('./weather_command');

cities = require('../lib/users_cities');

logger = require('winston');

module.exports = {
  onLocation: function(msg, location_msg, safe) {
    var forecst, latitude, longitude, ref, res, userId;
    userId = location_msg.from.id;
    ref = location_msg.location, latitude = ref.latitude, longitude = ref.longitude;
    res = weather_command.weather(null, latitude, longitude, 'ru');
    forecst = weather_command.forecast(null, latitude, longitude, 'ru');
    cities.add(userId, null, latitude, longitude);
    return safe(res).then((function(_this) {
      return function(data) {
        if (data.cod !== 200) {
          logger.debug(data);
          return location_msg.reply('Город не найден.');
        } else {
          return weather_command.sendInlineInstead(msg, data, safe(forecst));
        }
      };
    })(this));
  }
};
