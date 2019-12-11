const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    // defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error', colorize: true, }),
        new winston.transports.File({ filename: 'logs/info.log', level: 'info', colorize: true, }),
        // new winston.transports.Console({ format: winston.format.simple(), colorize: true, }),
    ]
});


/**
 * @description If it's not an production environment do logs on console
 */
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

logger.info(`Winston setup complete!`);

module.exports = logger;