const fs = require('fs');
const path = require('path');

// Log analysis and visualization utilities
class LogAnalyzer {
    constructor(logDir = path.join(__dirname, '../logs')) {
        this.logDir = logDir;
    }

    // Parse log files and extract metrics
    async parseLogsForDate(date = new Date().toISOString().split('T')[0]) {
        const logFile = path.join(this.logDir, `tudungsaji-${date}.log`);
        
        if (!fs.existsSync(logFile)) {
            throw new Error(`Log file not found for date: ${date}`);
        }

        const logContent = fs.readFileSync(logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        const metrics = {
            totalRequests: 0,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            avgResponseTime: 0,
            slowRequests: 0,
            authenticationEvents: {
                logins: 0,
                loginFailures: 0,
                registrations: 0
            },
            topEndpoints: {},
            errorTypes: {},
            securityEvents: 0,
            performanceIssues: 0
        };

        const responseTimes = [];

        for (const line of lines) {
            try {
                const logEntry = JSON.parse(line);
                
                // Count by level
                switch (logEntry.level) {
                    case 'error':
                        metrics.errorCount++;
                        if (logEntry.error || logEntry.message.includes('Error')) {
                            const errorType = logEntry.error?.split(':')[0] || logEntry.message;
                            metrics.errorTypes[errorType] = (metrics.errorTypes[errorType] || 0) + 1;
                        }
                        break;
                    case 'warn':
                        metrics.warningCount++;
                        break;
                    case 'info':
                        metrics.infoCount++;
                        break;
                }

                // HTTP Request analysis
                if (logEntry.message === 'HTTP Request') {
                    metrics.totalRequests++;
                    
                    // Track endpoints
                    const endpoint = logEntry.url;
                    metrics.topEndpoints[endpoint] = (metrics.topEndpoints[endpoint] || 0) + 1;
                    
                    // Response time analysis
                    const responseTime = parseInt(logEntry.responseTime?.replace('ms', '')) || 0;
                    if (responseTime > 0) {
                        responseTimes.push(responseTime);
                        if (responseTime > 2000) {
                            metrics.slowRequests++;
                        }
                    }
                }

                // Authentication events
                if (logEntry.message === 'Authentication Event') {
                    switch (logEntry.event) {
                        case 'login_success':
                            metrics.authenticationEvents.logins++;
                            break;
                        case 'login_failed':
                            metrics.authenticationEvents.loginFailures++;
                            break;
                        case 'user_registered':
                            metrics.authenticationEvents.registrations++;
                            break;
                    }
                }

                // Security events
                if (logEntry.security) {
                    metrics.securityEvents++;
                }

                // Performance issues
                if (logEntry.performance === 'slow' || logEntry.warning === 'slow_response') {
                    metrics.performanceIssues++;
                }

            } catch (error) {
                // Skip invalid JSON lines
                continue;
            }
        }

        // Calculate average response time
        if (responseTimes.length > 0) {
            metrics.avgResponseTime = Math.round(
                responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            );
        }

        return metrics;
    }

    // Generate daily report
    async generateDailyReport(date = new Date().toISOString().split('T')[0]) {
        const metrics = await this.parseLogsForDate(date);
        
        const report = `
# 📊 TudungSaji Daily Log Report - ${date}

## 📈 Overview Metrics
- **Total Requests**: ${metrics.totalRequests}
- **Error Count**: ${metrics.errorCount} (${((metrics.errorCount / metrics.totalRequests) * 100).toFixed(2)}%)
- **Warning Count**: ${metrics.warningCount}
- **Average Response Time**: ${metrics.avgResponseTime}ms
- **Slow Requests**: ${metrics.slowRequests}

## 🔐 Authentication Events
- **Successful Logins**: ${metrics.authenticationEvents.logins}
- **Failed Logins**: ${metrics.authenticationEvents.loginFailures}
- **New Registrations**: ${metrics.authenticationEvents.registrations}
- **Login Success Rate**: ${((metrics.authenticationEvents.logins / (metrics.authenticationEvents.logins + metrics.authenticationEvents.loginFailures)) * 100).toFixed(2)}%

## 🏆 Top Endpoints
${Object.entries(metrics.topEndpoints)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => `- **${endpoint}**: ${count} requests`)
    .join('\n')}

## ❌ Error Types
${Object.entries(metrics.errorTypes)
    .sort(([,a], [,b]) => b - a)
    .map(([error, count]) => `- **${error}**: ${count} occurrences`)
    .join('\n')}

## 🚨 Security & Performance
- **Security Events**: ${metrics.securityEvents}
- **Performance Issues**: ${metrics.performanceIssues}

## 📊 Health Score
${this.calculateHealthScore(metrics)}

---
*Generated on ${new Date().toISOString()}*
        `;

        return report;
    }

    // Calculate application health score
    calculateHealthScore(metrics) {
        let score = 100;
        
        // Deduct for errors
        const errorRate = (metrics.errorCount / metrics.totalRequests) * 100;
        if (errorRate > 5) score -= 30;
        else if (errorRate > 1) score -= 10;
        
        // Deduct for slow responses
        const slowRate = (metrics.slowRequests / metrics.totalRequests) * 100;
        if (slowRate > 10) score -= 20;
        else if (slowRate > 5) score -= 10;
        
        // Deduct for security issues
        if (metrics.securityEvents > 0) score -= 15;
        
        // Deduct for authentication failures
        const authFailureRate = metrics.authenticationEvents.loginFailures / 
                               (metrics.authenticationEvents.logins + metrics.authenticationEvents.loginFailures) * 100;
        if (authFailureRate > 20) score -= 15;
        else if (authFailureRate > 10) score -= 5;
        
        score = Math.max(0, score);
        
        let healthStatus = 'Excellent';
        if (score < 50) healthStatus = 'Critical';
        else if (score < 70) healthStatus = 'Warning';
        else if (score < 85) healthStatus = 'Good';
        
        return `**Health Score: ${score}/100** (${healthStatus})`;
    }

    // Real-time log monitoring
    monitorLogs(callback) {
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `tudungsaji-${today}.log`);
        
        console.log(`📊 Monitoring logs: ${logFile}`);
        
        if (fs.existsSync(logFile)) {
            fs.watchFile(logFile, (curr, prev) => {
                if (curr.mtime > prev.mtime) {
                    // File was modified, read new content
                    const content = fs.readFileSync(logFile, 'utf8');
                    const lines = content.split('\n').filter(line => line.trim());
                    const lastLine = lines[lines.length - 1];
                    
                    try {
                        const logEntry = JSON.parse(lastLine);
                        callback(logEntry);
                    } catch (error) {
                        // Skip invalid JSON
                    }
                }
            });
        }
    }
}

// Example usage and testing
async function runLogAnalysis() {
    const analyzer = new LogAnalyzer();
    
    try {
        console.log('🔍 Starting log analysis...');
        
        // Generate today's report
        const report = await analyzer.generateDailyReport();
        console.log(report);
        
        // Start real-time monitoring
        console.log('👁️  Starting real-time monitoring...');
        analyzer.monitorLogs((logEntry) => {
            if (logEntry.level === 'error') {
                console.log('🚨 NEW ERROR:', logEntry.message);
            } else if (logEntry.security) {
                console.log('🛡️  SECURITY EVENT:', logEntry);
            } else if (logEntry.performance === 'slow') {
                console.log('🐌 SLOW REQUEST:', logEntry.url, logEntry.responseTime);
            }
        });
        
    } catch (error) {
        console.error('Log analysis failed:', error.message);
    }
}

// Export for use in other modules
module.exports = { LogAnalyzer, runLogAnalysis };

// Run if called directly
if (require.main === module) {
    runLogAnalysis();
}