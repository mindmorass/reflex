---
name: api-design-patterns
description: API design patterns for REST, GraphQL, and gRPC. Use when designing API endpoints, creating OpenAPI specs, implementing GraphQL schemas, or building gRPC services.
---

# API Design Patterns

Best practices for designing and implementing APIs.

## REST API Design

### Resource Naming

```
# Good - noun-based, plural resources
GET    /api/v1/users
GET    /api/v1/users/{id}
POST   /api/v1/users
PUT    /api/v1/users/{id}
PATCH  /api/v1/users/{id}
DELETE /api/v1/users/{id}

# Nested resources
GET    /api/v1/users/{id}/orders
POST   /api/v1/users/{id}/orders

# Actions as sub-resources
POST   /api/v1/users/{id}/activate
POST   /api/v1/orders/{id}/cancel

# Filtering, sorting, pagination
GET    /api/v1/users?status=active&sort=-created_at&page=1&limit=20
```

### OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: User API
  version: 1.0.0
  description: User management API

servers:
  - url: https://api.example.com/v1
    description: Production

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/UserStatus'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

    post:
      summary: Create user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - created_at
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        status:
          $ref: '#/components/schemas/UserStatus'
        created_at:
          type: string
          format: date-time

    UserStatus:
      type: string
      enum: [active, inactive, pending]

    CreateUserRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
        name:
          type: string

    UserListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    Conflict:
      description: Conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

### Response Envelope Pattern

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, List

T = TypeVar('T')

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int

class ApiResponse(BaseModel, Generic[T]):
    data: T
    meta: Optional[dict] = None

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMeta

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: str

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[List[ErrorDetail]] = None
    request_id: str
```

## GraphQL Design

### Schema Design

```graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
  me: User
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
}

type User implements Node {
  id: ID!
  email: String!
  name: String
  status: UserStatus!
  orders(first: Int, after: String): OrderConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum UserStatus {
  ACTIVE
  INACTIVE
  PENDING
}

input UserFilter {
  status: UserStatus
  search: String
  createdAfter: DateTime
}

input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
}

input CreateUserInput {
  email: String!
  name: String
}

type CreateUserPayload {
  user: User
  errors: [UserError!]
}

type UserError {
  field: String
  message: String!
  code: UserErrorCode!
}

enum UserErrorCode {
  EMAIL_TAKEN
  INVALID_EMAIL
  VALIDATION_ERROR
}

# Relay-style connection for pagination
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

interface Node {
  id: ID!
}

scalar DateTime
```

### DataLoader Pattern

```python
from aiodataloader import DataLoader

class UserLoader(DataLoader):
    async def batch_load_fn(self, user_ids):
        users = await User.query.where(User.id.in_(user_ids)).gino.all()
        user_map = {user.id: user for user in users}
        return [user_map.get(user_id) for user_id in user_ids]

# Usage in resolver
async def resolve_user(_, info, id):
    return await info.context.user_loader.load(id)
```

## gRPC Design

### Proto Definition

```protobuf
syntax = "proto3";

package user.v1;

option go_package = "github.com/example/user/v1;userv1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);

  // Streaming
  rpc WatchUsers(WatchUsersRequest) returns (stream UserEvent);
}

message User {
  string id = 1;
  string email = 2;
  string name = 3;
  UserStatus status = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_PENDING = 3;
}

message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  User user = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  string filter = 3;  // CEL expression
  string order_by = 4;
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
  int32 total_count = 3;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
}

message CreateUserResponse {
  User user = 1;
}

message UpdateUserRequest {
  string id = 1;
  User user = 2;
  google.protobuf.FieldMask update_mask = 3;
}

message UpdateUserResponse {
  User user = 1;
}

message DeleteUserRequest {
  string id = 1;
}

message DeleteUserResponse {}

message WatchUsersRequest {
  string filter = 1;
}

message UserEvent {
  enum EventType {
    EVENT_TYPE_UNSPECIFIED = 0;
    EVENT_TYPE_CREATED = 1;
    EVENT_TYPE_UPDATED = 2;
    EVENT_TYPE_DELETED = 3;
  }

  EventType type = 1;
  User user = 2;
}
```

## Versioning Strategies

```python
# URL versioning (recommended for REST)
# /api/v1/users
# /api/v2/users

# Header versioning
# Accept: application/vnd.api+json; version=1

# Query parameter versioning
# /api/users?version=1

# FastAPI example with URL versioning
from fastapi import FastAPI, APIRouter

app = FastAPI()

v1_router = APIRouter(prefix="/api/v1")
v2_router = APIRouter(prefix="/api/v2")

@v1_router.get("/users")
async def list_users_v1():
    return {"version": "v1", "users": []}

@v2_router.get("/users")
async def list_users_v2():
    return {"version": "v2", "data": [], "pagination": {}}

app.include_router(v1_router)
app.include_router(v2_router)
```

## Rate Limiting

```python
from fastapi import FastAPI, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter

@app.get("/api/v1/users")
@limiter.limit("100/minute")
async def list_users(request: Request):
    return {"users": []}

# Response headers
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1640000000
```

## References

- [REST API Design Guidelines](https://restfulapi.net/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [gRPC Documentation](https://grpc.io/docs/)
