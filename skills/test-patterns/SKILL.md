---
name: test-patterns
description: Patterns and best practices for writing effective, maintainable tests.
---


# Test Patterns Skill

## Purpose
Patterns and best practices for writing effective, maintainable tests.

## When to Use
- Writing tests for new functionality
- Improving existing test coverage
- Setting up test infrastructure
- Debugging test failures

## Test Types Overview

| Type | Scope | Speed | Purpose |
|------|-------|-------|---------|
| Unit | Single function/class | Fast (ms) | Logic correctness |
| Integration | Component interactions | Medium (s) | API contracts |
| E2E | Full system | Slow (s-min) | User workflows |
| Property | Generated inputs | Medium | Edge case discovery |
| Snapshot | Output comparison | Fast | Change detection |

## AAA Pattern (Arrange-Act-Assert)

Every test should follow this structure:

```python
def test_user_can_place_order():
    # Arrange - Set up test data and dependencies
    user = create_test_user(balance=100)
    product = create_test_product(price=50)
    order_service = OrderService(mock_db)

    # Act - Execute the code under test
    order = order_service.place_order(user, product)

    # Assert - Verify the outcome
    assert order.status == "placed"
    assert user.balance == 50
```

## Unit Testing Patterns

### Test Isolation
Each test should be independent:

```python
# Bad - tests share state
class TestCounter:
    counter = Counter()  # Shared!

    def test_increment(self):
        self.counter.increment()
        assert self.counter.value == 1

    def test_decrement(self):
        self.counter.decrement()
        assert self.counter.value == 0  # Fails! Value is 0 from previous test

# Good - isolated tests
class TestCounter:
    @pytest.fixture
    def counter(self):
        return Counter()  # Fresh instance per test

    def test_increment(self, counter):
        counter.increment()
        assert counter.value == 1

    def test_decrement(self, counter):
        counter.decrement()
        assert counter.value == -1
```

### Parameterized Tests
Test multiple inputs efficiently:

```python
# Python (pytest)
@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("World", "WORLD"),
    ("", ""),
    ("123", "123"),
])
def test_uppercase(input, expected):
    assert uppercase(input) == expected

# JavaScript (Jest)
test.each([
    ["hello", "HELLO"],
    ["World", "WORLD"],
    ["", ""],
    ["123", "123"],
])("uppercase(%s) returns %s", (input, expected) => {
    expect(uppercase(input)).toBe(expected);
});
```

### Testing Exceptions

```python
# Python
def test_divide_by_zero_raises():
    with pytest.raises(ZeroDivisionError) as exc_info:
        divide(10, 0)
    assert "cannot divide by zero" in str(exc_info.value)

# JavaScript
test("divide by zero throws", () => {
    expect(() => divide(10, 0)).toThrow("cannot divide by zero");
});
```

## Mocking Patterns

### When to Mock
- External services (APIs, databases)
- Time-dependent code
- Non-deterministic behavior
- Expensive operations

### Basic Mocking

```python
# Python
from unittest.mock import Mock, patch

def test_sends_email():
    email_service = Mock()
    user_service = UserService(email_service=email_service)

    user_service.register("test@example.com")

    email_service.send.assert_called_once_with(
        to="test@example.com",
        subject="Welcome!"
    )

# Patch external dependencies
@patch("myapp.services.requests.get")
def test_fetches_data(mock_get):
    mock_get.return_value.json.return_value = {"data": "test"}

    result = fetch_user_data(123)

    assert result == {"data": "test"}
    mock_get.assert_called_with("https://api.example.com/users/123")
```

```javascript
// JavaScript
test("sends email on registration", () => {
    const emailService = { send: vi.fn() };
    const userService = new UserService(emailService);

    userService.register("test@example.com");

    expect(emailService.send).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "Welcome!",
    });
});
```

### Mocking Time

```python
# Python
from freezegun import freeze_time

@freeze_time("2024-01-15 10:00:00")
def test_scheduled_task():
    scheduler = Scheduler()
    task = scheduler.schedule_for_tomorrow()
    assert task.run_at == datetime(2024, 1, 16, 10, 0, 0)

# JavaScript
test("scheduled task", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00"));

    const task = scheduler.scheduleForTomorrow();

    expect(task.runAt).toEqual(new Date("2024-01-16T10:00:00"));

    vi.useRealTimers();
});
```

## Integration Testing Patterns

### Database Testing

```python
# Use fixtures for test database
@pytest.fixture
def db_session(test_engine):
    """Create a new database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.mark.integration
def test_user_persistence(db_session):
    user = User(name="Test", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    retrieved = db_session.query(User).filter_by(email="test@example.com").first()
    assert retrieved is not None
    assert retrieved.name == "Test"
```

### API Testing

```python
# Python (FastAPI)
from fastapi.testclient import TestClient

@pytest.fixture
def client(app):
    return TestClient(app)

def test_create_user(client):
    response = client.post("/users", json={
        "name": "Test User",
        "email": "test@example.com"
    })

    assert response.status_code == 201
    assert response.json()["name"] == "Test User"
    assert "id" in response.json()

def test_get_user_not_found(client):
    response = client.get("/users/99999")
    assert response.status_code == 404
```

## Test Data Management

### Factories

```python
# Python (factory_boy)
class UserFactory(factory.Factory):
    class Meta:
        model = User

    name = factory.Faker("name")
    email = factory.Faker("email")
    created_at = factory.LazyFunction(datetime.utcnow)

# Usage
def test_user_creation():
    user = UserFactory()  # Random valid user
    admin = UserFactory(role="admin")  # With override
    users = UserFactory.create_batch(5)  # Multiple users
```

### Fixtures

```python
@pytest.fixture
def sample_order():
    return Order(
        id=1,
        items=[
            OrderItem(product_id=1, quantity=2, price=10.00),
            OrderItem(product_id=2, quantity=1, price=25.00),
        ],
        customer_id=1,
        status="pending",
        total=45.00
    )

def test_order_total(sample_order):
    assert sample_order.calculate_total() == 45.00
```

## Property-Based Testing

Discover edge cases automatically:

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    """Sorting twice gives same result as sorting once."""
    assert sorted(sorted(xs)) == sorted(xs)

@given(st.integers(), st.integers())
def test_addition_is_commutative(a, b):
    """a + b == b + a"""
    assert a + b == b + a

@given(st.text())
def test_roundtrip_serialization(s):
    """Encode then decode returns original."""
    assert decode(encode(s)) == s
```

## Async Testing

```python
# Python
@pytest.mark.asyncio
async def test_async_fetch():
    result = await fetch_data("https://api.example.com/data")
    assert result["status"] == "success"

# JavaScript
test("async fetch", async () => {
    const result = await fetchData("https://api.example.com/data");
    expect(result.status).toBe("success");
});
```

## Test Organization

### File Structure
```
tests/
├── conftest.py              # Shared fixtures
├── unit/
│   ├── test_user_service.py
│   └── test_order_service.py
├── integration/
│   ├── test_api.py
│   └── test_database.py
├── e2e/
│   └── test_checkout_flow.py
└── fixtures/
    └── sample_data.json
```

### Naming Conventions
```python
# Test file: test_<module>.py
# Test class: Test<Class>
# Test method: test_<method>_<scenario>_<expected>

class TestUserService:
    def test_get_user_when_exists_returns_user(self):
        ...

    def test_get_user_when_not_found_raises_not_found_error(self):
        ...

    def test_create_user_with_valid_data_creates_user(self):
        ...

    def test_create_user_with_invalid_email_raises_validation_error(self):
        ...
```

## Coverage Best Practices

### What to Cover
- Happy paths
- Error conditions
- Edge cases
- Boundary values
- Security-sensitive code

### What NOT to Obsess Over
- Simple getters/setters
- Framework code
- Generated code
- 100% coverage at all costs

### Coverage Commands
```bash
# Python
pytest --cov=src --cov-report=html --cov-report=term-missing

# JavaScript
jest --coverage
vitest --coverage
```

## Anti-Patterns to Avoid

### Flaky Tests
```python
# Bad - depends on timing
def test_async_operation():
    start_async_operation()
    time.sleep(1)  # May not be enough!
    assert get_result() == expected

# Good - wait for condition
def test_async_operation():
    start_async_operation()
    result = wait_for(get_result, timeout=5)
    assert result == expected
```

### Testing Implementation
```python
# Bad - tests internal implementation
def test_user_service():
    service = UserService()
    service.create_user("test@example.com")
    assert service._users["test@example.com"] is not None  # Internal!

# Good - tests behavior
def test_user_service():
    service = UserService()
    service.create_user("test@example.com")
    user = service.get_user("test@example.com")
    assert user is not None
```

### Over-Mocking
```python
# Bad - mocks everything, tests nothing
def test_process_order():
    mock_validator = Mock(return_value=True)
    mock_calculator = Mock(return_value=100)
    mock_saver = Mock()

    process_order(mock_validator, mock_calculator, mock_saver)

    # Only tests that functions were called, not that they work

# Good - use real objects where practical
def test_process_order():
    validator = OrderValidator()  # Real
    calculator = PriceCalculator()  # Real
    saver = Mock()  # Mock external dependency

    process_order(validator, calculator, saver)
    # Tests real validation and calculation logic
```

## Checklist

### Before Writing Tests:
- [ ] Understand the requirements
- [ ] Identify test cases (happy path, errors, edge cases)
- [ ] Set up test fixtures

### Test Quality:
- [ ] Tests are independent
- [ ] Tests are deterministic
- [ ] Tests have clear names
- [ ] Tests follow AAA pattern
- [ ] Tests are fast
- [ ] Assertions are specific

### Coverage:
- [ ] Happy paths covered
- [ ] Error cases covered
- [ ] Edge cases covered
- [ ] Security-sensitive code tested
