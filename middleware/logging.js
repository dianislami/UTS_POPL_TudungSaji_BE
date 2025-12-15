const logger = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    const start = Date.now();
    
    // Override res.json to capture response data
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - start;
        
        // Log performance metrics
        if (duration > 1000) {
            logger.warn('Slow Response Detected', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${duration}ms`,
                userId: req.user?.id,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent'),
                performance: 'slow'
            });
        } else {
            logger.info('Performance Metric', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${duration}ms`,
                userId: req.user?.id,
                statusCode: res.statusCode
            });
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Rate limiting monitoring
const rateLimitMonitor = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Simple in-memory rate limiting (in production, use Redis)
    if (!global.requestCounts) {
        global.requestCounts = new Map();
    }
    
    const requestKey = `${ip}_${Math.floor(now / 60000)}`; // Per minute
    const currentCount = global.requestCounts.get(requestKey) || 0;
    
    if (currentCount > 100) { // 100 requests per minute limit
        logger.warn('Rate Limit Exceeded', {
            ip,
            count: currentCount,
            endpoint: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            security: 'rate_limit_violation'
        });
    }
    
    global.requestCounts.set(requestKey, currentCount + 1);
    
    // Clean old entries
    for (const [key] of global.requestCounts) {
        const keyTime = parseInt(key.split('_')[1]);
        if (now - keyTime > 300000) { // 5 minutes
            global.requestCounts.delete(key);
        }
    }
    
    next();
};

// Security monitoring middleware
const securityMonitor = (req, res, next) => {
    const suspiciousPatterns = [
        /\.\.\//,           // Directory traversal
        /<script>/i,        // XSS attempts
        /union\s+select/i,  // SQL injection
        /alert\(/i,         // JavaScript injection
        /document\.cookie/i // Cookie theft attempts
    ];
    
    const fullUrl = req.originalUrl;
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl) || pattern.test(body) || pattern.test(query)) {
            logger.error('Security Threat Detected', {
                type: 'suspicious_pattern',
                ip: req.ip,
                method: req.method,
                url: fullUrl,
                body: req.body,
                query: req.query,
                userAgent: req.get('User-Agent'),
                pattern: pattern.toString(),
                security: 'threat_detected'
            });
            break;
        }
    }
    
    next();
};

// Database operation logger
const dbLogger = {
    logQuery: (model, operation, query, result, executionTime) => {
        const logData = {
            model: model.modelName,
            operation,
            query,
            executionTime: `${executionTime}ms`,
            resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
            timestamp: new Date().toISOString()
        };
        
        if (executionTime > 1000) {
            logger.warn('Slow Database Query', {
                ...logData,
                performance: 'slow_query'
            });
        } else {
            logger.info('Database Operation', logData);
        }
    },
    
    logError: (model, operation, query, error) => {
        logger.error('Database Error', {
            model: model.modelName,
            operation,
            query,
            error: error.message,
            stack: error.stack,
            database: 'error'
        });
    }
};

// API versioning and deprecation logger
const apiVersionMonitor = (req, res, next) => {
    const apiVersion = req.get('API-Version') || '1.0';
    
    // Log API version usage
    logger.info('API Version Usage', {
        version: apiVersion,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
    });
    
    // Check for deprecated endpoints
    const deprecatedEndpoints = [
        '/api/v1/recipes/old-format',
        '/api/auth/legacy-login'
    ];
    
    if (deprecatedEndpoints.includes(req.originalUrl)) {
        logger.warn('Deprecated API Usage', {
            endpoint: req.originalUrl,
            version: apiVersion,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            deprecation: 'deprecated_endpoint'
        });
    }
    
    next();
};

// Error context enricher
const errorContextEnricher = (error, req) => {
    return {
        ...error,
        context: {
            method: req.method,
            url: req.originalUrl,
            userId: req.user?.id,
            sessionId: req.sessionID,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            headers: req.headers,
            body: req.method !== 'GET' ? req.body : undefined,
            query: req.query
        }
    };
};

module.exports = {
    performanceMonitor,
    rateLimitMonitor,
    securityMonitor,
    dbLogger,
    apiVersionMonitor,
    errorContextEnricher
};