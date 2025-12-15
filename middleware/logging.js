// Import custom logger utility
const logger = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
    // Record request start time
    const start = Date.now();
    
    // Override res.json to capture response data
    const originalJson = res.json;
    res.json = function(data) {
        // Calculate response duration
        const duration = Date.now() - start;
        
        // Log performance metrics based on response time
        if (duration > 1000) {
            // Log warning for slow responses
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
            // Log normal performance metrics
            logger.info('Performance Metric', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${duration}ms`,
                userId: req.user?.id,
                statusCode: res.statusCode
            });
        }
        
        // Return original JSON response
        return originalJson.call(this, data);
    };
    
    // Continue to next middleware
    next();
};

// Rate limiting monitoring
const rateLimitMonitor = (req, res, next) => {
    // Get client IP address
    const ip = req.ip;
    const now = Date.now();
    
    // Initialize global request counter if not exists
    if (!global.requestCounts) {
        global.requestCounts = new Map();
    }
    
    // Create unique key per IP per minute
    const requestKey = `${ip}_${Math.floor(now / 60000)}`; // Per minute
    const currentCount = global.requestCounts.get(requestKey) || 0;
    
    // Log warning if request exceeds allowed limit
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
    
    // Increment request count
    global.requestCounts.set(requestKey, currentCount + 1);
    
    // Remove outdated request records
    for (const [key] of global.requestCounts) {
        const keyTime = parseInt(key.split('_')[1]);
        if (now - keyTime > 300000) { // 5 minutes
            global.requestCounts.delete(key);
        }
    }
    
    // Continue to next middleware
    next();
};

// Security monitoring middleware
const securityMonitor = (req, res, next) => {
    // Define patterns for detecting suspicious requests
    const suspiciousPatterns = [
        /\.\.\//,           // Directory traversal
        /<script>/i,        // XSS attempts
        /union\s+select/i,  // SQL injection
        /alert\(/i,         // JavaScript injection
        /document\.cookie/i // Cookie theft attempts
    ];
    
    // Collect request data for inspection
    const fullUrl = req.originalUrl;
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    
    // Check request against suspicious patterns
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl) || pattern.test(body) || pattern.test(query)) {
            // Log detected security threat
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
    
    // Continue to next middleware
    next();
};

// Database operation logger
const dbLogger = {
    // Log successful database queries
    logQuery: (model, operation, query, result, executionTime) => {
        const logData = {
            model: model.modelName,
            operation,
            query,
            executionTime: `${executionTime}ms`,
            resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
            timestamp: new Date().toISOString()
        };
        
        // Log warning for slow queries
        if (executionTime > 1000) {
            logger.warn('Slow Database Query', {
                ...logData,
                performance: 'slow_query'
            });
        } else {
            // Log normal database operations
            logger.info('Database Operation', logData);
        }
    },
    
    // Log database errors
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
    // Get API version from request header
    const apiVersion = req.get('API-Version') || '1.0';
    
    // Log API version usage
    logger.info('API Version Usage', {
        version: apiVersion,
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
    });
    
    // Define deprecated API endpoints
    const deprecatedEndpoints = [
        '/api/v1/recipes/old-format',
        '/api/auth/legacy-login'
    ];
    
    // Log warning if deprecated endpoint is accessed
    if (deprecatedEndpoints.includes(req.originalUrl)) {
        logger.warn('Deprecated API Usage', {
            endpoint: req.originalUrl,
            version: apiVersion,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
            deprecation: 'deprecated_endpoint'
        });
    }
    
    // Continue to next middleware
    next();
};

// Error context enricher
const errorContextEnricher = (error, req) => {
    // Attach request context information to error object
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

// Export all monitoring utilities
module.exports = {
    performanceMonitor,
    rateLimitMonitor,
    securityMonitor,
    dbLogger,
    apiVersionMonitor,
    errorContextEnricher
};