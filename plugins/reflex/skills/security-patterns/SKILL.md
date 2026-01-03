---
name: security-patterns
description: Application security patterns and best practices. Use when implementing authentication, authorization, input validation, secrets management, OWASP protections, or security hardening.
---

# Security Patterns

Best practices for application security.

## Authentication Patterns

### JWT Authentication

```python
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key"  # Use secrets manager in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(user_id: str, roles: list[str]) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "roles": roles,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### OAuth2/OIDC Integration

```python
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()
oauth.register(
    name='google',
    client_id='...',
    client_secret='...',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get('/auth/google')
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/auth/google/callback')
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    # Create or update user in database
    return {"user": user_info}
```

## Authorization Patterns

### Role-Based Access Control (RBAC)

```python
from enum import Enum
from functools import wraps
from fastapi import HTTPException, Depends

class Role(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class Permission(str, Enum):
    READ_USERS = "read:users"
    WRITE_USERS = "write:users"
    DELETE_USERS = "delete:users"
    READ_ORDERS = "read:orders"
    WRITE_ORDERS = "write:orders"

ROLE_PERMISSIONS = {
    Role.ADMIN: [p for p in Permission],
    Role.MANAGER: [
        Permission.READ_USERS,
        Permission.READ_ORDERS,
        Permission.WRITE_ORDERS,
    ],
    Role.USER: [
        Permission.READ_ORDERS,
    ],
}

def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=Depends(get_current_user), **kwargs):
            user_permissions = []
            for role in current_user.roles:
                user_permissions.extend(ROLE_PERMISSIONS.get(role, []))

            if permission not in user_permissions:
                raise HTTPException(status_code=403, detail="Permission denied")

            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

@app.delete("/users/{user_id}")
@require_permission(Permission.DELETE_USERS)
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    # Delete user logic
    pass
```

### Attribute-Based Access Control (ABAC)

```python
from dataclasses import dataclass
from typing import Any

@dataclass
class AccessContext:
    user: "User"
    resource: Any
    action: str
    environment: dict

def can_access(ctx: AccessContext) -> bool:
    """Policy-based access control."""
    policies = [
        # Owner can do anything with their resources
        lambda c: c.resource.owner_id == c.user.id,

        # Admins can do anything
        lambda c: "admin" in c.user.roles,

        # Managers can read all in their department
        lambda c: (
            c.action == "read" and
            "manager" in c.user.roles and
            c.resource.department == c.user.department
        ),

        # Time-based access
        lambda c: (
            c.action == "read" and
            c.environment.get("hour", 0) >= 9 and
            c.environment.get("hour", 0) <= 17
        ),
    ]

    return any(policy(ctx) for policy in policies)
```

## Input Validation

### Pydantic Validation

```python
from pydantic import BaseModel, EmailStr, Field, validator
import re

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain special character')
        return v

    @validator('name')
    def sanitize_name(cls, v):
        # Remove potentially dangerous characters
        return re.sub(r'[<>&"\']', '', v).strip()
```

### SQL Injection Prevention

```python
# BAD - vulnerable to SQL injection
def get_user_bad(username: str):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return db.execute(query)

# GOOD - parameterized query
def get_user_good(username: str):
    query = "SELECT * FROM users WHERE username = :username"
    return db.execute(text(query), {"username": username})

# GOOD - ORM
def get_user_orm(username: str):
    return User.query.filter(User.username == username).first()
```

## Secrets Management

### Environment-Based Secrets

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    api_key: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Usage
settings = get_settings()
```

### AWS Secrets Manager Integration

```python
import boto3
import json
from functools import lru_cache

@lru_cache()
def get_secret(secret_name: str, region: str = "us-east-1") -> dict:
    client = boto3.client("secretsmanager", region_name=region)
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])

# Usage
db_creds = get_secret("prod/database")
DATABASE_URL = f"postgresql://{db_creds['username']}:{db_creds['password']}@{db_creds['host']}/{db_creds['database']}"
```

## OWASP Top 10 Protections

### XSS Prevention

```python
from markupsafe import escape
from fastapi.responses import HTMLResponse

# Escape user input before rendering
@app.get("/profile/{username}")
async def profile(username: str):
    safe_username = escape(username)
    return HTMLResponse(f"<h1>Profile: {safe_username}</h1>")

# Content Security Policy header
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "frame-ancestors 'none';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

### CSRF Protection

```python
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel

class CsrfSettings(BaseModel):
    secret_key: str = "your-csrf-secret"
    cookie_samesite: str = "strict"

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.post("/transfer")
async def transfer_funds(
    request: Request,
    csrf_protect: CsrfProtect = Depends()
):
    await csrf_protect.validate_csrf(request)
    # Process transfer
```

### Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    # Login logic
    pass

@app.get("/api/data")
@limiter.limit("100/minute")
async def get_data(request: Request):
    # API logic
    pass
```

## Security Headers

```python
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# Force HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

# Restrict allowed hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# HSTS header
@app.middleware("http")
async def add_hsts_header(request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )
    return response
```

## Audit Logging

```python
import structlog
from datetime import datetime

audit_logger = structlog.get_logger("audit")

def log_security_event(
    event_type: str,
    user_id: str,
    resource: str,
    action: str,
    success: bool,
    details: dict = None
):
    audit_logger.info(
        "security_event",
        event_type=event_type,
        user_id=user_id,
        resource=resource,
        action=action,
        success=success,
        details=details,
        timestamp=datetime.utcnow().isoformat(),
        ip_address=get_client_ip(),
    )

# Usage
log_security_event(
    event_type="authentication",
    user_id="user123",
    resource="login",
    action="login_attempt",
    success=True,
    details={"method": "password"}
)
```

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
