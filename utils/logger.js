const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Custom format for logs
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${level}: ${message} ${metaString}`;
    })
);

// Daily rotate file transport for all logs
const fileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'tudungsaji-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    format: logFormat
});

// Daily rotate file transport for errors only
const errorFileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: logFormat
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { 
        service: 'tudungsaji-backend',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        fileTransport,
        errorFileTransport
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Helper functions for structured logging
logger.logRequest = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.id || 'anonymous'
        };

        if (res.statusCode >= 400) {
            logger.warn('HTTP Request Error', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });
    
    next();
};

logger.logError = (error, context = {}) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        ...context
    });
};

logger.logAuth = (event, userId, details = {}) => {
    logger.info('Authentication Event', {
        event,
        userId,
        timestamp: new Date().toISOString(),
        ...details
    });
};

logger.logDatabase = (operation, collection, details = {}) => {
    logger.info('Database Operation', {
        operation,
        collection,
        timestamp: new Date().toISOString(),
        ...details
    });
};

module.exports = logger;