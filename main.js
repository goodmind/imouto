// Generated by CoffeeScript 1.9.1
var Bot, TIMEOUT, bot, config, isInitialized, isQuerying, lastUpdate, logger, query, retryUpdateLoop, tg, updateLoop;

require('./lib/polyfills');

logger = require('winston');

logger.setLevels({
  debug: 0,
  info: 1,
  outMsg: 1,
  inMsg: 1,
  warn: 2,
  error: 3
});

logger.addColors({
  debug: 'gray',
  info: 'white',
  outMsg: 'bold green',
  inMsg: 'green',
  warn: 'bold yellow',
  error: 'bold red'
});

logger.remove(logger.transports.Console);

logger.add(logger.transports.Console, {
  formatter: function(arg) {
    var date, level, message, text;
    level = arg.level, message = arg.message;
    date = (new Date).toLocaleString();
    text = "[" + date + "] " + message;
    return logger.config.colorize(level, text);
  }
});

logger.add(logger.transports.File, {
  json: false,
  filename: __dirname + "/logs/" + (new Date).toLocaleDateString() + ".log",
  formatter: function(arg) {
    var date, level, message;
    level = arg.level, message = arg.message;
    date = (new Date).toLocaleString();
    return "[" + date + "] [" + level + "] " + message;
  }
});

logger.level = 'debug';

config = require('./lib/config');

query = require('./lib/query');

tg = require('./lib/tg');

Bot = require('./bot');

TIMEOUT = 60;

isInitialized = false;

process.on('uncaughtException', function(err) {
  logger.error(err.stack);
  if (isInitialized) {
    return retryUpdateLoop();
  }
});

retryUpdateLoop = function() {
  logger.warn('Waiting 30 seconds before retry...');
  return setTimeout(function() {
    logger.info('Retrying getUpdates...');
    return updateLoop(bot);
  }, 30000);
};

lastUpdate = null;

isQuerying = false;

updateLoop = function(bot) {
  var args, e;
  try {
    args = {
      timeout: TIMEOUT
    };
    if (lastUpdate != null) {
      args.offset = lastUpdate + 1;
    }
    if (!isQuerying) {
      isQuerying = true;
      return query('getUpdates', args, {
        timeout: (TIMEOUT + 1) * 1000
      }).then(function(upd) {
        var i, len, u;
        isQuerying = false;
        if (upd.error != null) {
          return retryUpdateLoop();
        } else {
          for (i = 0, len = upd.length; i < len; i++) {
            u = upd[i];
            if ((lastUpdate == null) || u.update_id > lastUpdate) {
              lastUpdate = u.update_id;
            }
            if (u.message != null) {
              bot.onMessage(u.message);
            }
          }
          return updateLoop(bot);
        }
      }, function(err) {
        logger.error(err.stack);
        isQuerying = false;
        return retryUpdateLoop();
      });
    }
  } catch (_error) {
    e = _error;
    isQuerying = false;
    throw e;
  }
};

if (!config.options.token) {
  logger.info("Please set up the configuration file (config/main.config)!");
} else {
  logger.info("Starting...");
  bot = new Bot();
  bot.sudoList = config.sudoList;
  bot.bannedIds = config.bannedIds;
  bot.reloadPlugins();
  tg.getInfo().then(function(info) {
    config.setUserInfo(info);
    isInitialized = true;
    return updateLoop(bot);
  });
}
