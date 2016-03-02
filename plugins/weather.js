// Generated by CoffeeScript 1.10.0
var config, degToCard, icon, logger, misc, moment, offset, states, timezone, tz, weather;

logger = require('winston');

tz = require('coordinate-tz');

moment = require('moment-timezone');

misc = require('../lib/misc');

config = require('../lib/config');

states = require('../lib/country_codes');

moment.locale('ru');

degToCard = function(deg) {
  var directions, section, sectionDegrees;
  sectionDegrees = 360 / 16;
  section = Math.round(deg / sectionDegrees) % 16;
  directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
  return directions[section];
};

icon = function(type) {
  switch (type) {
    case "01d":
      return "☀️";
    case "01n":
      return "☀";
    case "02d":
      return "🌤";
    case "02n":
      return "🌤";
    case "03d":
      return "☁️";
    case "03n":
      return "☁️";
    case "04d":
      return "☁️";
    case "04n":
      return "☁️";
    case "09d":
      return "🌧";
    case "09n":
      return "🌧";
    case "10d":
      return "🌦";
    case "10n":
      return "🌦";
    case "11d":
      return "🌩";
    case "11n":
      return "🌩";
    case "13d":
      return "🌨";
    case "13n":
      return "🌨";
    case "50d":
      return "🌫";
    case "50n":
      return "🌫";
  }
};

timezone = function(lat, lon) {
  return tz.calculate(lat, lon).timezone;
};

offset = function(timezone) {
  return function(date) {
    var tzdate;
    tzdate = moment(date);
    return tzdate.tz(timezone);
  };
};

weather = function(cityName, lat, lon, lang) {
  var qs;
  qs = {
    units: 'metric',
    lang: lang,
    appid: config.options.weathermap
  };
  if (cityName != null) {
    qs.q = cityName;
  } else {
    qs.lat = lat;
    qs.lon = lon;
  }
  return misc.get('http://api.openweathermap.org/data/2.5/weather', {
    qs: qs,
    json: true
  });
};

module.exports = {
  name: 'Weather',
  pattern: /!(weather|погода)(?: (.+))?/,
  isConf: true,
  isAcceptMsg: function(msg) {
    return (msg.location != null) || this.matchPattern(msg, msg.text);
  },
  onMsg: function(msg, safe) {
    var lang, latitude, longitude, ref, res, txt;
    if (msg.location != null) {
      ref = msg.location, latitude = ref.latitude, longitude = ref.longitude;
      res = weather(null, latitude, longitude, 'ru');
    } else {
      lang = msg.match[1].toLowerCase() === 'weather' ? 'en' : 'ru';
      txt = msg.match[2];
      res = weather(txt, null, null, lang);
      if (txt == null) {
        return;
      }
    }
    return safe(res).then(function(data) {
      var desc, sunrise, sunset, type, zone;
      if (data.cod !== 200) {
        logger.debug(data);
        return msg.reply('Город не найден.');
      } else {
        type = icon(data['weather'][0]['icon']);
        zone = timezone(data['coord']['lat'], data['coord']['lon']);
        sunrise = sunset = offset(zone);
        desc = data.name + ", " + states[data.sys.country] + "\n\n" + type + " " + data.weather[0].description + "\n🌡 " + (Math.round(data.main.temp)) + " °C\n💦 " + data.main.humidity + "%\n💨 " + data.wind.speed + " км/ч, " + (degToCard(data.wind.deg)) + "\n🌅 " + (sunrise(data.sys.sunrise * 1000).format('LT')) + "\n🌄 " + (sunset(data.sys.sunset * 1000).format('LT'));
        return msg.send(desc);
      }
    });
  },
  onError: function(msg) {
    return msg.reply('Кажется, дождь начинается.');
  }
};