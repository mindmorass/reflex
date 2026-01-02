# Security Review Skill

## Purpose
Systematic security analysis patterns for identifying vulnerabilities in code and configurations.

## When to Use
- Reviewing code changes for security issues
- Conducting security audits
- Implementing security features
- Responding to security incidents

## OWASP Top 10 Checklist

### 1. Injection
**Risk:** Attacker-supplied data executed as code/query

```python
# Vulnerable - SQL Injection
query = f"SELECT * FROM users WHERE id = {user_id}"
db.execute(query)

# Secure - Parameterized query
query = "SELECT * FROM users WHERE id = ?"
db.execute(query, (user_id,))
```

```python
# Vulnerable - Command Injection
os.system(f"ping {hostname}")

# Secure - Use subprocess with list args
subprocess.run(["ping", hostname], check=True)
```

**Check:**
- [ ] SQL queries use parameterized statements
- [ ] Commands use subprocess with argument lists
- [ ] LDAP queries use proper escaping
- [ ] XML parsers disable external entities

### 2. Broken Authentication
**Risk:** Compromised identity verification

**Check:**
- [ ] Passwords hashed with strong algorithm (bcrypt, argon2)
- [ ] Session tokens are random and sufficient length
- [ ] Session invalidated on logout
- [ ] Rate limiting on login attempts
- [ ] MFA available for sensitive operations
- [ ] Password reset tokens expire

```python
# Vulnerable - Weak hashing
password_hash = hashlib.md5(password.encode()).hexdigest()

# Secure - Use bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

### 3. Sensitive Data Exposure
**Risk:** Unprotected sensitive information

**Check:**
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.2+ for data in transit
- [ ] Sensitive data not logged
- [ ] Credit card data PCI-DSS compliant
- [ ] PII handling follows regulations

```python
# Vulnerable - Logging sensitive data
logger.info(f"User {user.email} logged in with password {password}")

# Secure - Never log sensitive data
logger.info(f"User {user.id} logged in successfully")
```

### 4. XML External Entities (XXE)
**Risk:** XML parser processes external references

```python
# Vulnerable
from xml.etree import ElementTree
tree = ElementTree.parse(untrusted_xml)

# Secure - Disable external entities
import defusedxml.ElementTree as ET
tree = ET.parse(untrusted_xml)
```

**Check:**
- [ ] XML parsers configured to disable DTD processing
- [ ] External entity resolution disabled
- [ ] Using defusedxml or similar safe libraries

### 5. Broken Access Control
**Risk:** Users access unauthorized resources

```python
# Vulnerable - No authorization check
@app.get("/users/{user_id}/data")
def get_user_data(user_id: int):
    return db.get_user_data(user_id)

# Secure - Check authorization
@app.get("/users/{user_id}/data")
def get_user_data(user_id: int, current_user: User = Depends(get_current_user)):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(403, "Access denied")
    return db.get_user_data(user_id)
```

**Check:**
- [ ] Authorization checked on every request
- [ ] IDOR (Insecure Direct Object Reference) prevented
- [ ] Default deny policy
- [ ] Admin functions properly protected
- [ ] CORS configured correctly

### 6. Security Misconfiguration
**Risk:** Insecure default settings

**Check:**
- [ ] Debug mode disabled in production
- [ ] Default credentials changed
- [ ] Error messages don't expose internals
- [ ] Unnecessary features disabled
- [ ] Security headers configured

```python
# Vulnerable - Exposing stack traces
@app.exception_handler(Exception)
def handle_error(request, exc):
    return {"error": str(exc), "traceback": traceback.format_exc()}

# Secure - Generic error message
@app.exception_handler(Exception)
def handle_error(request, exc):
    logger.error(f"Error: {exc}", exc_info=True)  # Log internally
    return {"error": "An internal error occurred"}  # Generic to user
```

### 7. Cross-Site Scripting (XSS)
**Risk:** Attacker scripts executed in user's browser

```html
<!-- Vulnerable - Unescaped output -->
<div>Welcome, {{ user.name }}</div>

<!-- Secure - Auto-escaped (Jinja2 default) -->
<div>Welcome, {{ user.name | e }}</div>
```

```javascript
// Vulnerable - innerHTML with user data
element.innerHTML = userInput;

// Secure - textContent for text
element.textContent = userInput;

// Or sanitize HTML
element.innerHTML = DOMPurify.sanitize(userInput);
```

**Check:**
- [ ] Output encoding/escaping applied
- [ ] Content-Security-Policy header set
- [ ] HttpOnly flag on session cookies
- [ ] Using safe DOM manipulation methods

### 8. Insecure Deserialization
**Risk:** Malicious serialized objects executed

```python
# Vulnerable - pickle with untrusted data
data = pickle.loads(untrusted_data)

# Secure - Use JSON or safe formats
data = json.loads(untrusted_data)
```

**Check:**
- [ ] Avoid deserializing untrusted data
- [ ] Use safe serialization formats (JSON)
- [ ] Validate and sanitize before deserialization
- [ ] Implement integrity checks

### 9. Using Components with Known Vulnerabilities
**Risk:** Outdated dependencies with security flaws

```bash
# Check for vulnerabilities
pip-audit                    # Python
npm audit                    # Node.js
snyk test                    # Multi-language
```

**Check:**
- [ ] Dependencies regularly updated
- [ ] Automated vulnerability scanning
- [ ] No end-of-life components
- [ ] Software composition analysis in CI/CD

### 10. Insufficient Logging & Monitoring
**Risk:** Attacks go undetected

**Check:**
- [ ] Authentication events logged
- [ ] Authorization failures logged
- [ ] Input validation failures logged
- [ ] Logs protected from tampering
- [ ] Alerting configured for anomalies

```python
# Good logging practice
logger.warning(
    "Authentication failure",
    extra={
        "event": "auth_failure",
        "user_email": email,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
    }
)
```

## Security Headers

### Recommended Headers
```python
# FastAPI middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

## Input Validation

### Validation Patterns
```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    age: int

    @validator("name")
    def name_valid(cls, v):
        if not v or len(v) > 100:
            raise ValueError("Name must be 1-100 characters")
        if not v.replace(" ", "").isalnum():
            raise ValueError("Name must be alphanumeric")
        return v

    @validator("age")
    def age_valid(cls, v):
        if v < 0 or v > 150:
            raise ValueError("Invalid age")
        return v
```

## Secret Management

### DO:
- Use environment variables or secret managers
- Rotate secrets regularly
- Use different secrets per environment
- Audit secret access

### DON'T:
- Commit secrets to version control
- Log secrets
- Hardcode secrets
- Share secrets via insecure channels

```python
# Bad
API_KEY = "sk_live_1234567890"

# Good
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable required")
```

## Security Review Checklist

### Code Review
- [ ] No hardcoded secrets
- [ ] Input validation on all user data
- [ ] Output encoding applied
- [ ] Authorization checks present
- [ ] Parameterized queries used
- [ ] Secure password handling
- [ ] Proper error handling
- [ ] Logging doesn't expose sensitive data

### Configuration Review
- [ ] Debug mode off in production
- [ ] Security headers configured
- [ ] TLS properly configured
- [ ] CORS restricted appropriately
- [ ] Rate limiting enabled
- [ ] Default credentials changed

### Dependency Review
- [ ] Dependencies up to date
- [ ] No known vulnerabilities
- [ ] Minimal dependency footprint
- [ ] Trusted sources only

## Common Vulnerability Patterns

### Path Traversal
```python
# Vulnerable
file_path = f"/uploads/{filename}"
with open(file_path) as f:
    return f.read()

# Secure - Validate path
from pathlib import Path

base = Path("/uploads").resolve()
file_path = (base / filename).resolve()
if not str(file_path).startswith(str(base)):
    raise ValueError("Invalid path")
```

### Race Conditions
```python
# Vulnerable - TOCTOU (Time-of-check to time-of-use)
if user.balance >= amount:
    user.balance -= amount  # Another request could modify between check and use

# Secure - Atomic operation
with db.transaction():
    user = db.query(User).with_for_update().get(user_id)
    if user.balance >= amount:
        user.balance -= amount
```

### Mass Assignment
```python
# Vulnerable
user = User(**request.json())  # Could set is_admin=True

# Secure - Explicit fields
user = User(
    email=request.json["email"],
    name=request.json["name"]
)
```

## Reporting Format

```yaml
security_finding:
  id: SEC-001
  title: "SQL Injection in User Search"
  severity: critical
  cwe: CWE-89

  location:
    file: src/api/users.py
    line: 45
    function: search_users

  description: |
    User-supplied search parameter is concatenated directly into SQL query,
    allowing attackers to execute arbitrary SQL commands.

  impact: |
    - Data breach (read all user data)
    - Data modification/deletion
    - Potential remote code execution

  reproduction:
    - Navigate to /api/users/search
    - Enter: ' OR '1'='1
    - Observe all users returned

  recommendation: |
    Use parameterized queries:
    ```python
    cursor.execute("SELECT * FROM users WHERE name LIKE ?", (f"%{search}%",))
    ```

  references:
    - https://owasp.org/www-community/attacks/SQL_Injection
    - https://cwe.mitre.org/data/definitions/89.html
```
