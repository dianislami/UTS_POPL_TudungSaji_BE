# 📊 TudungSaji Logging & Debugging System

## 🎯 Overview
Comprehensive logging and debugging system untuk aplikasi TudungSaji menggunakan Winston logger dengan structured logging, daily log rotation, dan multiple log levels.

## 🛠️ Technical Implementation

### **Logger Configuration**
- **Winston Logger** dengan daily rotating files
- **Log Levels:** Error, Warning, Info, Debug
- **Structured Logging:** JSON format dengan metadata
- **File Rotation:** Daily rotation dengan 7 hari retention
- **Multiple Transports:** Console (development) + File (all environments)

### **Log Storage Structure**
```
BE_tudungsaji/
└── logs/
    ├── tudungsaji-2025-12-15.log    # All logs
    ├── error-2025-12-15.log         # Error logs only
    ├── tudungsaji-2025-12-14.log    # Previous day
    └── error-2025-12-14.log         # Previous errors
```

### **Logging Categories**
1. **HTTP Requests:** Method, URL, status, response time, user ID
2. **Authentication:** Login attempts, registrations, token events
3. **Database Operations:** Queries, connections, errors
4. **Application Errors:** Stack traces, context, user impact
5. **System Events:** Server start/stop, health checks

---

## 📋 Debugging Use Cases

### **Case 1: Authentication Failure Investigation**

#### **Scenario:**
Multiple users melaporkan tidak bisa login dengan credentials yang benar.

#### **Log Analysis:**
```json
// Log Entry 1: Failed Login Attempt
{
  "timestamp": "2025-12-15 10:30:15",
  "level": "warn",
  "message": "Authentication Event",
  "event": "login_failed",
  "userId": null,
  "email": "user@example.com",
  "reason": "invalid_password",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "service": "tudungsaji-backend"
}

// Log Entry 2: Database Error
{
  "timestamp": "2025-12-15 10:30:15",
  "level": "error",
  "message": "Database Operation",
  "operation": "findUser",
  "collection": "users",
  "error": "MongoTimeoutError: Server selection timed out",
  "context": "authentication"
}
```

#### **Debugging Process:**
1. **Identify Pattern:** Multiple authentication failures around 10:30
2. **Root Cause:** Database timeout during user lookup
3. **Solution:** Database connection pool optimization
4. **Prevention:** Add health check monitoring

#### **Resolution Logs:**
```json
{
  "timestamp": "2025-12-15 11:00:00",
  "level": "info",
  "message": "Database Connected",
  "database": "MongoDB",
  "connectionPool": "optimized",
  "action": "authentication_issue_resolved"
}
```

---

### **Case 2: Recipe Creation API Errors**

#### **Scenario:**
Users mengalami error 500 saat mencoba membuat resep baru.

#### **Log Analysis:**
```json
// Log Entry 1: HTTP Request
{
  "timestamp": "2025-12-15 14:15:30",
  "level": "info",
  "message": "HTTP Request",
  "method": "POST",
  "url": "/api/recipes",
  "statusCode": 500,
  "responseTime": "2500ms",
  "userId": "user123",
  "ip": "10.0.0.5"
}

// Log Entry 2: Application Error
{
  "timestamp": "2025-12-15 14:15:30",
  "level": "error",
  "message": "Application Error",
  "error": "ValidationError: Recipe validation failed",
  "stack": "ValidationError: Recipe validation failed...",
  "context": {
    "operation": "create_recipe",
    "userId": "user123",
    "payload": {
      "title": "",
      "ingredients": []
    }
  }
}
```

#### **Debugging Process:**
1. **Identify Issue:** High response time + validation errors
2. **Root Cause:** Frontend sending empty required fields
3. **Solution:** Add frontend validation + better error messages
4. **Prevention:** Add request validation middleware

#### **Fix Implementation:**
```json
{
  "timestamp": "2025-12-15 15:00:00",
  "level": "info",
  "message": "Recipe Validation",
  "event": "validation_improved",
  "changes": ["frontend_validation", "middleware_validation", "error_messages"]
}
```

---

### **Case 3: Performance Degradation**

#### **Scenario:**
Dashboard loading sangat lambat untuk users dengan banyak resep.

#### **Log Analysis:**
```json
// Log Entry 1: Slow Request
{
  "timestamp": "2025-12-15 16:20:45",
  "level": "warn",
  "message": "HTTP Request",
  "method": "GET",
  "url": "/api/recipes/user/user456",
  "statusCode": 200,
  "responseTime": "8500ms",
  "userId": "user456",
  "warning": "slow_response"
}

// Log Entry 2: Database Query
{
  "timestamp": "2025-12-15 16:20:45",
  "level": "info",
  "message": "Database Operation",
  "operation": "find",
  "collection": "recipes",
  "query": {"userId": "user456"},
  "executionTime": "8200ms",
  "documentsReturned": 2500,
  "warning": "large_dataset"
}
```

#### **Debugging Process:**
1. **Identify Performance Issue:** 8.5s response time
2. **Root Cause:** No pagination, loading 2500 recipes at once
3. **Solution:** Implement pagination + indexing
4. **Prevention:** Add performance monitoring alerts

#### **Optimization Results:**
```json
{
  "timestamp": "2025-12-15 17:00:00",
  "level": "info",
  "message": "Performance Optimization",
  "operation": "pagination_implemented",
  "before": "8500ms",
  "after": "450ms",
  "improvement": "94.7%",
  "changes": ["pagination", "indexing", "query_optimization"]
}
```

---

## 🔧 Monitoring Commands

### **Real-time Log Monitoring:**
```bash
# Watch all logs
tail -f logs/tudungsaji-$(date +%Y-%m-%d).log

# Watch only errors
tail -f logs/error-$(date +%Y-%m-%d).log

# Filter authentication events
grep "Authentication Event" logs/tudungsaji-$(date +%Y-%m-%d).log

# Monitor slow requests
grep "slow_response" logs/tudungsaji-$(date +%Y-%m-%d).log
```

### **Log Analysis Queries:**
```bash
# Count errors by hour
grep "level.*error" logs/tudungsaji-$(date +%Y-%m-%d).log | awk '{print substr($2,1,2)}' | sort | uniq -c

# Top error messages
grep "level.*error" logs/tudungsaja-$(date +%Y-%m-%d).log | jq -r '.message' | sort | uniq -c | sort -nr

# Authentication failures by IP
grep "login_failed" logs/tudungsaji-$(date +%Y-%m-%d).log | jq -r '.ip' | sort | uniq -c | sort -nr
```

---

## 📊 Log Metrics Dashboard

### **Key Performance Indicators (KPIs):**
1. **Error Rate:** < 1% of total requests
2. **Response Time:** 95th percentile < 1000ms
3. **Authentication Success Rate:** > 95%
4. **Database Connection Health:** 100% uptime
5. **API Availability:** > 99.9%

### **Alert Thresholds:**
- **Critical:** Error rate > 5%
- **Warning:** Response time > 2000ms
- **Info:** New user registrations spike

---

## 🚀 Implementation Benefits

### **Development Benefits:**
- **Fast Debugging:** Structured logs dengan context lengkap
- **Performance Monitoring:** Response time tracking
- **Error Tracking:** Stack traces dengan metadata
- **User Behavior:** Authentication dan usage patterns

### **Production Benefits:**
- **Issue Detection:** Proactive error monitoring
- **Performance Optimization:** Slow query identification
- **Security Monitoring:** Failed login attempts tracking
- **Capacity Planning:** Usage pattern analysis

### **Business Benefits:**
- **Reduced Downtime:** Faster issue resolution
- **Better UX:** Performance optimization berdasarkan real data
- **Security:** Anomaly detection dan threat monitoring
- **Data-Driven Decisions:** Usage analytics untuk feature development

---

## 🔄 Log Rotation & Retention

### **Retention Policy:**
- **All Logs:** 7 days rolling
- **Error Logs:** 14 days rolling
- **Archive:** Compress logs older than 7 days
- **Cleanup:** Auto-delete logs older than 30 days

### **File Size Management:**
- **Max File Size:** 20MB per file
- **Rotation Trigger:** Size or date-based
- **Compression:** gzip for archived logs
- **Storage:** Local filesystem (can be extended to S3/cloud storage)

---

## 🎯 Next Steps & Enhancements

### **Phase 2 Improvements:**
1. **ELK Stack Integration:** Elasticsearch + Kibana dashboard
2. **Real-time Alerts:** Slack/email notifications
3. **APM Integration:** Performance monitoring dengan distributed tracing
4. **Log Aggregation:** Centralized logging untuk multiple services
5. **ML-based Anomaly Detection:** Automatic issue detection

### **Production Readiness:**
- **Log Forwarding:** Send logs ke centralized logging system
- **Monitoring Integration:** Prometheus metrics + Grafana dashboards
- **Alert Management:** PagerDuty integration untuk critical issues
- **Compliance:** Log retention untuk audit requirements