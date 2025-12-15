const logger = require('../utils/logger');
const { LogAnalyzer } = require('../utils/logAnalysis');

// Simulate various scenarios for demonstration
class DebuggingScenarios {
    
    // Scenario 1: Authentication Issues
    static simulateAuthenticationIssues() {
        console.log('🔐 Simulating Authentication Issues...');
        
        // Simulate failed login attempts
        for (let i = 0; i < 5; i++) {
            logger.warn('Authentication Event', {
                event: 'login_failed',
                email: `user${i}@example.com`,
                reason: 'invalid_password',
                ip: `192.168.1.${100 + i}`,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                attempt: i + 1
            });
        }
        
        // Simulate database connection issue
        logger.error('Database Error', {
            operation: 'findUser',
            collection: 'users',
            error: 'MongoTimeoutError: Server selection timed out after 30000 ms',
            context: 'authentication'
        });
        
        // Simulate successful login after fix
        logger.info('Authentication Event', {
            event: 'login_success',
            userId: 'user123',
            email: 'user@example.com',
            ip: '192.168.1.100',
            sessionDuration: '2h'
        });
    }
    
    // Scenario 2: Recipe API Performance Issues
    static simulatePerformanceIssues() {
        console.log('⏱️ Simulating Performance Issues...');
        
        // Simulate slow recipe queries
        logger.warn('HTTP Request', {
            method: 'GET',
            url: '/api/recipes/user/user456',
            statusCode: 200,
            responseTime: '8500ms',
            userId: 'user456',
            warning: 'slow_response'
        });
        
        logger.warn('Database Operation', {
            operation: 'find',
            collection: 'recipes',
            query: '{"userId": "user456"}',
            executionTime: '8200ms',
            documentsReturned: 2500,
            warning: 'large_dataset'
        });
        
        // Simulate recipe creation validation errors
        logger.error('Application Error', {
            message: 'Recipe validation failed: Title is required',
            stack: 'ValidationError: Recipe validation failed...',
            context: {
                operation: 'create_recipe',
                userId: 'user789',
                payload: {
                    title: '',
                    ingredients: [],
                    instructions: ''
                }
            }
        });
    }
    
    // Scenario 3: Security Events
    static simulateSecurityEvents() {
        console.log('🛡️ Simulating Security Events...');
        
        // Simulate XSS attempt
        logger.error('Security Threat Detected', {
            type: 'xss_attempt',
            ip: '10.0.0.50',
            method: 'POST',
            url: '/api/recipes',
            body: {
                title: '<script>alert("xss")</script>',
                description: 'Normal recipe'
            },
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
            security: 'threat_detected'
        });
        
        // Simulate rate limiting
        logger.warn('Rate Limit Exceeded', {
            ip: '192.168.1.200',
            count: 150,
            endpoint: '/api/auth/login',
            method: 'POST',
            userAgent: 'Bot/1.0',
            security: 'rate_limit_violation'
        });
        
        // Simulate SQL injection attempt
        logger.error('Security Threat Detected', {
            type: 'sql_injection',
            ip: '203.0.113.50',
            method: 'GET',
            url: '/api/recipes?search=\' UNION SELECT * FROM users--',
            userAgent: 'sqlmap/1.5',
            security: 'threat_detected'
        });
    }
    
    // Scenario 4: Normal Operations
    static simulateNormalOperations() {
        console.log('✅ Simulating Normal Operations...');
        
        // Simulate normal requests
        const endpoints = [
            '/api/recipes',
            '/api/auth/me', 
            '/api/recipes/favorites',
            '/dashboard',
            '/api/user/profile'
        ];
        
        endpoints.forEach((endpoint, index) => {
            logger.info('HTTP Request', {
                method: 'GET',
                url: endpoint,
                statusCode: 200,
                responseTime: `${150 + index * 50}ms`,
                userId: `user${index + 1}`,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            });
        });
        
        // Simulate successful registrations
        for (let i = 1; i <= 3; i++) {
            logger.info('Authentication Event', {
                event: 'user_registered',
                userId: `newuser${i}`,
                email: `newuser${i}@example.com`,
                registrationMethod: 'form'
            });
        }
    }
    
    // Run all scenarios
    static async runAllScenarios() {
        console.log('🎬 Starting Debugging Scenarios Demo...\n');
        
        // Normal operations
        this.simulateNormalOperations();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Authentication issues
        this.simulateAuthenticationIssues();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Performance issues
        this.simulatePerformanceIssues();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Security events
        this.simulateSecurityEvents();
        
        console.log('\n✅ All scenarios completed!');
        console.log('📊 Check logs/tudungsaji-YYYY-MM-DD.log for detailed logs');
        
        // Generate analysis report
        try {
            const analyzer = new LogAnalyzer();
            const report = await analyzer.generateDailyReport();
            console.log('\n📈 Generated Analysis Report:');
            console.log(report);
        } catch (error) {
            console.log('⚠️  Analysis report will be available after log files are created');
        }
    }
}

// Export for testing
module.exports = DebuggingScenarios;

// Run scenarios if called directly
if (require.main === module) {
    DebuggingScenarios.runAllScenarios().catch(console.error);
}