# Logging System Test & Demo Guide

## Quick Start Testing

### 1. Start the Server with Logging
```bash
npm run dev
```

### 2. Run Debugging Scenarios Demo
```bash
node test/debuggingScenarios.js
```

### 3. Test Logging Scripts
```bash
# View real-time logs
npm run logs:tail

# Analyze logs (after generating some logs)
npm run logs:analyze

# Monitor logs with automatic refresh
npm run logs:monitor

# View only error logs
npm run logs:errors
```

## Manual Testing Scenarios

### Authentication Testing
```bash
# Test failed login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Test successful login (if user exists)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"valid@example.com","password":"correctpassword"}'
```

### Performance Testing
```bash
# Test recipe endpoint (should log performance metrics)
curl -X GET http://localhost:5000/api/recipes

# Create multiple requests to test rate limiting
for i in {1..20}; do curl -X GET http://localhost:5000/api/recipes; done
```

### Security Testing
```bash
# Test XSS attempt
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(\"xss\")</script>","description":"test"}'

# Test SQL injection attempt
curl -X GET "http://localhost:5000/api/recipes?search=' UNION SELECT * FROM users--"
```

## Expected Log Output Examples

### Normal Request Log
```json
{
  "level": "info",
  "message": "HTTP Request",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "meta": {
    "method": "GET",
    "url": "/api/recipes",
    "statusCode": 200,
    "responseTime": "245ms",
    "userId": "user123",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Error Log
```json
{
  "level": "error",
  "message": "Database Error",
  "timestamp": "2024-01-15T10:30:15.456Z",
  "meta": {
    "operation": "findUser",
    "collection": "users",
    "error": "MongoTimeoutError: Server selection timed out",
    "context": "authentication"
  }
}
```

### Security Threat Log
```json
{
  "level": "error",
  "message": "Security Threat Detected",
  "timestamp": "2024-01-15T10:30:30.789Z",
  "meta": {
    "type": "xss_attempt",
    "ip": "192.168.1.100",
    "method": "POST",
    "url": "/api/recipes",
    "security": "threat_detected"
  }
}
```

## Debugging Workflow

### Step 1: Identify Issue
```bash
# Check recent errors
npm run logs:errors

# Or monitor logs in real-time
npm run logs:tail
```

### Step 2: Analyze Patterns
```bash
# Generate analysis report
npm run logs:analyze
```

### Step 3: Filter Specific Issues
```bash
# Find authentication issues
grep -i "auth" logs/tudungsaji-*.log

# Find performance issues
grep -i "slow\|timeout\|performance" logs/tudungsaji-*.log

# Find security threats
grep -i "security\|threat\|xss\|injection" logs/tudungsaji-*.log
```

## Log File Locations

- **Application Logs**: `logs/tudungsaji-YYYY-MM-DD.log`
- **Error Logs**: `logs/error-YYYY-MM-DD.log`
- **Combined Logs**: `logs/combined-YYYY-MM-DD.log`

## Monitoring Commands

```bash
# Real-time log monitoring
tail -f logs/tudungsaji-$(date +%Y-%m-%d).log

# Monitor only errors
tail -f logs/error-$(date +%Y-%m-%d).log

# Count log levels for today
grep -c "\"level\":\"error\"" logs/tudungsaji-$(date +%Y-%m-%d).log
grep -c "\"level\":\"warn\"" logs/tudungsaji-$(date +%Y-%m-%d).log
grep -c "\"level\":\"info\"" logs/tudungsaji-$(date +%Y-%m-%d).log
```

## Academic Evaluation Points

**Error Logging**: Complete with stack traces and context
**Info Logging**: Request tracking, user actions, system events
**Warning Logging**: Performance issues, rate limiting, validation failures
**Debugging Cases**: 3 detailed scenarios with solutions
**Professional Setup**: Winston with daily rotation, structured JSON
**Monitoring Tools**: Real-time analysis and reporting scripts
**Documentation**: Comprehensive guide with examples

## Troubleshooting

### Logs Not Appearing?
1. Check if `logs/` directory exists: `mkdir -p logs`
2. Verify permissions: `ls -la logs/`
3. Check server startup logs for errors

### Permission Errors?
```bash
# Fix log directory permissions
chmod 755 logs/
chmod 644 logs/*.log
```

### Want to Clear Old Logs?
```bash
npm run logs:clean
```

This logging system provides production-ready monitoring and debugging capabilities suitable for academic evaluation and real-world deployment.