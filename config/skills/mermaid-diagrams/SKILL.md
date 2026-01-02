# Mermaid Diagrams Skill

## Purpose
Create clear, well-structured mermaid diagrams for documentation and visualization.

## When to Use
- Visualizing system architecture
- Documenting workflows and processes
- Creating entity relationship diagrams
- Illustrating sequences and interactions
- Building state machines and flowcharts

## Diagram Types

### 1. Flowchart
Best for: Decision trees, process flows, algorithms

```mermaid
flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

**Syntax Reference:**
```
flowchart TD|TB|BT|LR|RL
    node[Rectangle]
    node(Rounded)
    node([Stadium])
    node[[Subroutine]]
    node[(Database)]
    node((Circle))
    node{Diamond}
    node{{Hexagon}}
    node[/Parallelogram/]
```

**Direction Options:**
- `TD` / `TB` - Top to bottom
- `BT` - Bottom to top
- `LR` - Left to right
- `RL` - Right to left

### 2. Sequence Diagram
Best for: API calls, message passing, interactions over time

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant D as Database

    C->>S: POST /api/users
    activate S
    S->>D: INSERT user
    D-->>S: user_id
    S-->>C: 201 Created
    deactivate S
```

**Arrow Types:**
```
->    Solid line without arrow
-->   Dotted line without arrow
->>   Solid line with arrowhead
-->>  Dotted line with arrowhead
-x    Solid line with cross
--x   Dotted line with cross
-)    Solid line with open arrow
--)   Dotted line with open arrow
```

**Activation:**
```
activate Actor
deactivate Actor
```

**Notes:**
```
Note right of Actor: Text
Note left of Actor: Text
Note over Actor1,Actor2: Text
```

### 3. Entity Relationship Diagram
Best for: Database schemas, data models

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        int id PK
        string email UK
        string name
        datetime created_at
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int id PK
        int user_id FK
        decimal total
        string status
    }
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
```

**Relationship Syntax:**
```
||--||  One to one
||--o{  One to many
o{--o{  Many to many
||--|{  One to one or more
```

**Attribute Types:**
- `PK` - Primary Key
- `FK` - Foreign Key
- `UK` - Unique Key

### 4. State Diagram
Best for: State machines, lifecycle diagrams

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending: Submit
    Pending --> Approved: Approve
    Pending --> Rejected: Reject
    Rejected --> Draft: Revise
    Approved --> Published: Publish
    Published --> Archived: Archive
    Archived --> [*]
```

**Syntax:**
```
[*]           Start/End state
state "Name"  Named state
-->           Transition
: label       Transition label
```

**Composite States:**
```mermaid
stateDiagram-v2
    state Processing {
        [*] --> Validating
        Validating --> Transforming
        Transforming --> Saving
        Saving --> [*]
    }
```

### 5. Class Diagram
Best for: Object-oriented design, API structures

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string name
        +create() User
        +update(data) bool
        +delete() bool
    }

    class Order {
        +int id
        +User user
        +List~OrderItem~ items
        +calculate_total() decimal
    }

    class OrderItem {
        +int id
        +Product product
        +int quantity
    }

    User "1" --> "*" Order : places
    Order "1" --> "*" OrderItem : contains
```

**Visibility:**
- `+` Public
- `-` Private
- `#` Protected
- `~` Package/Internal

### 6. Gantt Chart
Best for: Project timelines, schedules

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD

    section Planning
    Requirements     :a1, 2024-01-01, 7d
    Design           :a2, after a1, 5d

    section Development
    Backend API      :b1, after a2, 14d
    Frontend UI      :b2, after a2, 14d

    section Testing
    Integration      :c1, after b1 b2, 5d
    UAT              :c2, after c1, 5d

    section Deployment
    Release          :milestone, after c2, 0d
```

### 7. Pie Chart
Best for: Distribution, proportions

```mermaid
pie showData
    title Traffic Sources
    "Organic Search" : 45
    "Direct" : 25
    "Social Media" : 20
    "Referral" : 10
```

### 8. Git Graph
Best for: Branch strategies, git workflows

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature 1"
    branch feature/auth
    commit id: "Add login"
    commit id: "Add logout"
    checkout develop
    merge feature/auth
    checkout main
    merge develop tag: "v1.0"
```

### 9. C4 Context Diagram
Best for: System context, architecture overview

```mermaid
C4Context
    title System Context Diagram

    Person(user, "User", "A user of the system")
    System(system, "Our System", "The system we're building")
    System_Ext(email, "Email Service", "Sends emails")
    System_Ext(payment, "Payment Gateway", "Processes payments")

    Rel(user, system, "Uses")
    Rel(system, email, "Sends emails via")
    Rel(system, payment, "Processes payments via")
```

## Best Practices

### Clarity
- Keep diagrams focused on one concept
- Use clear, descriptive labels
- Limit nodes to what's essential
- Use consistent naming conventions

### Layout
- Choose direction based on content (LR for timelines, TD for hierarchies)
- Group related elements
- Use subgraphs for logical grouping

### Styling
```mermaid
flowchart LR
    A[Node A]:::success --> B[Node B]:::warning
    B --> C[Node C]:::error

    classDef success fill:#90EE90,stroke:#228B22
    classDef warning fill:#FFD700,stroke:#B8860B
    classDef error fill:#FFB6C1,stroke:#DC143C
```

### Subgraphs
```mermaid
flowchart TB
    subgraph Frontend
        A[React App]
        B[Next.js]
    end

    subgraph Backend
        C[API Server]
        D[Worker]
    end

    subgraph Data
        E[(PostgreSQL)]
        F[(Redis)]
    end

    A --> C
    B --> C
    C --> E
    C --> F
    D --> E
```

## Diagram Selection Guide

| Use Case | Diagram Type |
|----------|--------------|
| Process/workflow | Flowchart |
| API interactions | Sequence |
| Database schema | ERD |
| Object design | Class |
| State transitions | State |
| Project timeline | Gantt |
| Proportions | Pie |
| Git workflow | Git Graph |
| System overview | C4 Context |

## Common Patterns

### API Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant A as Auth Service
    participant S as Service

    C->>G: Request + Token
    G->>A: Validate Token
    A-->>G: Token Valid
    G->>S: Forward Request
    S-->>G: Response
    G-->>C: Response
```

### Microservices Architecture
```mermaid
flowchart TB
    subgraph Gateway
        AG[API Gateway]
    end

    subgraph Services
        US[User Service]
        OS[Order Service]
        PS[Product Service]
    end

    subgraph Data
        UD[(User DB)]
        OD[(Order DB)]
        PD[(Product DB)]
    end

    subgraph Messaging
        MQ[Message Queue]
    end

    AG --> US
    AG --> OS
    AG --> PS

    US --> UD
    OS --> OD
    PS --> PD

    OS --> MQ
    US --> MQ
```

### CI/CD Pipeline
```mermaid
flowchart LR
    A[Commit] --> B[Build]
    B --> C[Test]
    C --> D{Tests Pass?}
    D -->|Yes| E[Deploy Staging]
    D -->|No| F[Notify]
    E --> G[Integration Tests]
    G --> H{Pass?}
    H -->|Yes| I[Deploy Production]
    H -->|No| F
```

## Integration Notes

This skill is used in conjunction with:
- `obsidian-publisher` - Obsidian renders mermaid natively
- `joplin-publisher` - Joplin supports mermaid in markdown

Diagrams should be embedded as fenced code blocks:
~~~markdown
```mermaid
flowchart TD
    A --> B
```
~~~
