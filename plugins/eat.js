// Generated by CoffeeScript 1.10.0
(function() {
  var APIKey, APIUrl, DetailAPIUrl, PhotoAPIUrl, config, days, deg2rad, findEfoos, getDetailInfo, getDistanceFromLatLonInKm, getEfoosByReq, getPhotoByReference, getWorkTime, misc, normalizeDistance, priceLevels, radiusKeyboard;

  misc = require('../lib/misc');

  config = require('../lib/config');

  APIUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  PhotoAPIUrl = 'https://maps.googleapis.com/maps/api/place/photo';

  DetailAPIUrl = 'https://maps.googleapis.com/maps/api/place/details/json';

  APIKey = config.options.googlekey;

  radiusKeyboard = [
    [
      {
        text: '1km',
        callback_data: '1000'
      }, {
        text: '2km',
        callback_data: '2000'
      }, {
        text: '5km',
        callback_data: '5000'
      }, {
        text: '10km',
        callback_data: '10000'
      }
    ]
  ];

  days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  priceLevels = ['бесплатно', 'недорого', 'среднее по цене', 'дорого', 'очень дорого'];

  getWorkTime = function(periods) {
    var close, currentDay, day, open, period;
    currentDay = (new Date()).getDay();
    if (periods != null) {
      period = periods[currentDay];
      if ((period != null) && (period.open != null) && (period.close != null)) {
        open = period.open.time.substr(0, 2) + ':' + period.open.time.substr(2);
        close = period.close.time.substr(0, 2) + ':' + period.close.time.substr(2);
        day = days[currentDay];
        return day + " - с " + open + " до " + close;
      } else {
        return 'Нет информации';
      }
    } else {
      return 'Нет информации';
    }
  };

  normalizeDistance = function(distance) {
    if (distance < 1) {
      return (distance * 1000).toFixed() + 'м';
    } else {
      return distance.toFixed(2) + 'км';
    }
  };

  getDistanceFromLatLonInKm = function(lat1, lon1, lat2, lon2) {
    var R, a, c, dLat, dLon;
    R = 6371;
    dLat = deg2rad(lat2 - lat1);
    dLon = deg2rad(lon2 - lon1);
    a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  getDetailInfo = function(placeid) {
    var qs;
    qs = {
      key: APIKey,
      placeid: placeid,
      language: 'ru'
    };
    return misc.get(DetailAPIUrl, {
      qs: qs,
      json: true
    });
  };

  deg2rad = function(deg) {
    return deg * (Math.PI / 180);
  };

  getPhotoByReference = function(reference) {
    return misc.get(PhotoAPIUrl, {
      qs: {
        key: APIKey,
        photoreference: reference,
        maxwidth: 800
      }
    });
  };

  findEfoos = function(cb, msg, location) {
    var qs;
    qs = {
      key: APIKey,
      location: location.latitude + ',' + location.longitude,
      radius: cb.data,
      language: 'ru',
      types: 'lawyer|bar|cafe|restaurant'
    };
    return misc.get(APIUrl, {
      qs: qs,
      json: true
    });
  };

  getEfoosByReq = function(datas, reqData, cb) {
    var data, distance, index, priceLevel, rating;
    index = reqData.current - 1;
    data = datas[index];
    if (data.price_level != null) {
      priceLevel = priceLevels[data.price_level];
    } else {
      priceLevel = 'Нет информации';
    }
    rating = 0;
    if (data.rating != null) {
      rating = data.rating;
    }
    distance = getDistanceFromLatLonInKm(reqData.location.latitude, reqData.location.longitude, data.geometry.location.lat, data.geometry.location.lng);
    distance = normalizeDistance(distance);
    return getDetailInfo(data.place_id).then((function(_this) {
      return function(response) {
        var address, keyboard, phoneNumber, raw, result, time;
        if (response.result != null) {
          result = response.result;
          phoneNumber = 'Нет информации';
          if (result.international_phone_number != null) {
            phoneNumber = result.international_phone_number;
          }
          address = 'Нет информации';
          if (result.formatted_address != null) {
            address = result.formatted_address;
          }
          if ((result.opening_hours != null) && (result.opening_hours.periods != null)) {
            time = getWorkTime(result.opening_hours.periods);
          } else {
            time = 'Нет информации';
          }
          raw = reqData.current + "/" + reqData.total + "\nНазвание: " + data.name + "\nВремя работы: " + time + "\nУровень цен: " + priceLevel + "\nРейтинг: " + rating + "\nРасстояние: " + distance + "\nТелефон: " + phoneNumber + "\nАдрес: " + address;
          keyboard = [
            [
              {
                text: '<<',
                callback_data: 'prev'
              }, {
                text: 'Карта',
                url: result.url
              }, {
                text: 'Фото',
                callback_data: 'photo'
              }, {
                text: '>>',
                callback_data: 'next'
              }
            ]
          ];
          return cb({
            raw: raw,
            keyboard: keyboard
          });
        }
      };
    })(this));
  };

  module.exports = {
    onLocation: function(msg, location_msg) {
      return this.changeToRadiusInline(msg, location_msg.location);
    },
    changeToRadiusInline: function(msg, location) {
      return msg.edit('Выберите радиус поиска.', {
        inlineKeyboard: radiusKeyboard,
        preview: false,
        callback: (function(_this) {
          return function(_cb, _msg) {
            return _this.findEfoos(_cb, _msg, location);
          };
        })(this)
      });
    },
    findEfoos: function(cb, msg, location) {
      return findEfoos(cb, msg, location).then((function(_this) {
        return function(data) {
          return _this.displayFirst(msg, data, location);
        };
      })(this));
    },
    displayFirst: function(msg, data, location) {
      var reqData;
      if ((data.results != null) && data.results.length > 0) {
        reqData = {
          current: 1,
          total: data.results.length,
          location: location
        };
        return getEfoosByReq(data.results, reqData, (function(_this) {
          return function(efoos) {
            return msg.edit(efoos.raw, {
              preview: false,
              inlineKeyboard: efoos.keyboard,
              callback: function(_cb, _msg) {
                return _this.viewAction(_cb, _msg, data, reqData);
              }
            });
          };
        })(this));
      }
    },
    viewAction: function(cb, msg, data, reqData) {
      if (cb.data === 'prev' && reqData.current > 1) {
        reqData.current--;
        return getEfoosByReq(data.results, reqData, (function(_this) {
          return function(efoos) {
            return msg.edit(efoos.raw, {
              preview: false,
              inlineKeyboard: efoos.keyboard
            });
          };
        })(this));
      } else if (cb.data === 'next' && reqData.current < reqData.total) {
        reqData.current++;
        return getEfoosByReq(data.results, reqData, (function(_this) {
          return function(efoos) {
            return msg.edit(efoos.raw, {
              preview: false,
              inlineKeyboard: efoos.keyboard
            });
          };
        })(this));
      } else if (cb.data === 'photo' && data.results[reqData.current - 1].photos.length > 0) {
        return this.sendImageFromUrl(msg, PhotoAPIUrl + "?key=" + APIKey + "&photoreference=" + data.results[reqData.current - 1].photos[0].photo_reference + "&maxwidth=800");
      }
    },
    sendImageFromUrl: function(msg, url, options) {
      return misc.download(url).then(function(res) {
        return msg.sendPhoto(res, options);
      }, function(err) {
        logger.warn(err);
        return msg.send("Не загружается: " + url);
      });
    }
  };

}).call(this);
