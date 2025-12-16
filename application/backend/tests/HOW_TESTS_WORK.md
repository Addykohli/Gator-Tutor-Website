# Test Documentation

This directory contains unit tests for the backend application, specifically testing soft delete functionality and chat read flag features.

## Test Structure

### Test Configuration (`conftest.py`)

The `conftest.py` file sets up pytest fixtures that are shared across all test files:

#### Database Fixtures

- **`test_engine`**: Creates an in-memory SQLite database for testing. This ensures tests run in isolation without affecting the production database.
- **`test_db`**: Provides a database session for each test. The session is automatically rolled back and closed after each test.

#### User Fixtures

- **`test_user`**: Creates a standard test user with:
  - Email: `test.user@sfsu.edu`
  - Role: `student`
  - `is_deleted`: `False`

- **`test_user_a`**: Creates test user A for chat tests
  - Email: `user.a@sfsu.edu`
  - Role: `student`

- **`test_user_b`**: Creates test user B for chat tests
  - Email: `user.b@sfsu.edu`
  - Role: `student`

- **`test_tutor_user`**: Creates a tutor user with an associated tutor profile
  - Email: `tutor.test@sfsu.edu`
  - Role: `tutor`
  - Includes a `TutorProfile` with status `approved`

## Running Tests

### Prerequisites

Ensure all dependencies are installed:
```bash
cd application/backend
uv pip install -r requirements.txt
```

### Run All Tests

```bash
uv run pytest tests/ -v
```

### Run Specific Test File

```bash
# Run only soft delete tests
uv run pytest tests/test_admin_soft_delete.py -v

# Run only chat read flag tests
uv run pytest tests/test_chat_read_flag.py -v
```

### Run Specific Test

```bash
uv run pytest tests/test_admin_soft_delete.py::test_drop_user_sets_is_deleted -v
```

## Test Files

### `test_admin_soft_delete.py`

Tests for the soft delete functionality that allows admins to "delete" users without actually removing them from the database.

#### Test Cases

1. **`test_create_and_verify_user`**
   - Verifies that test users can be created and retrieved from the database
   - Ensures `is_deleted` defaults to `False`

2. **`test_drop_user_sets_is_deleted`**
   - Tests that calling `drop_user()` sets the `is_deleted` flag to `True`
   - Verifies the response contains correct deletion information

3. **`test_drop_user_preserves_user_in_database`**
   - Confirms that soft-deleted users still exist in the database
   - This is the key difference between soft delete and hard delete

4. **`test_drop_user_anonymizes_email`**
   - Verifies that deleted users' emails are anonymized
   - Email format: `deleted_{user_id}_{original_email}`
   - Prevents email reuse while maintaining unique constraint

5. **`test_deleted_user_cannot_login`**
   - Tests that `get_user()` filters out deleted users
   - Ensures deleted users cannot authenticate

6. **`test_drop_tutor_user_deactivates_profile`**
   - Verifies that when a tutor is soft-deleted, their tutor profile status is set to `rejected`
   - This hides them from tutor search results

7. **`test_drop_user_with_role_verification`**
   - Tests role verification functionality
   - Verifies that dropping with wrong role raises an error
   - Tests successful deletion with correct role

8. **`test_drop_nonexistent_user`**
   - Tests error handling for non-existent users
   - Verifies that 404 error is raised appropriately

#### How Soft Delete Works

1. User is marked as deleted by setting `is_deleted = True`
2. Email is anonymized to prevent reuse
3. If user is a tutor, their profile status is set to `rejected`
4. User record remains in database (preserves historical data)
5. Deleted users are filtered out of authentication and search queries

### `test_chat_read_flag.py`

Tests for the chat message read/unread functionality.

#### Test Cases

1. **`test_create_message_is_unread_by_default`**
   - Verifies that new messages have `is_read = False` by default
   - Tests message creation with correct sender/receiver

2. **`test_mark_message_read`**
   - Tests the `mark_message_read` endpoint
   - Verifies that `is_read` flag is set to `True` after marking
   - Checks database state after marking

3. **`test_mark_message_read_toggle_multiple_times`**
   - Tests that marking a message as read multiple times doesn't cause issues
   - Verifies idempotency of the read operation

4. **`test_bulk_mark_conversation_read`**
   - Tests the bulk mark-read endpoint
   - Creates multiple messages and marks all as read at once
   - Verifies all messages in conversation are marked

5. **`test_get_chat_includes_is_read`**
   - Verifies that `get_chat()` response includes `is_read` field
   - Tests that the field value is correct (False initially, True after marking)

6. **`test_mark_nonexistent_message_read`**
   - Tests error handling for non-existent messages
   - Verifies 404 error is raised

7. **`test_bulk_mark_read_only_affects_unread_messages`**
   - Tests that bulk mark-read only affects unread messages
   - Verifies that already-read messages are not counted in the update

#### How Chat Read Flag Works

1. Messages are created with `is_read = False` by default
2. Frontend can mark individual messages as read via `PATCH /api/chat/messages/{message_id}/read`
3. Frontend can mark entire conversations as read via `PATCH /api/chat/messages/mark-read`
4. The `is_read` flag is included in all chat message responses
5. Bulk operations only affect unread messages (idempotent)

## Test Isolation

Each test runs in complete isolation:

- **Fresh Database**: Each test gets a new in-memory SQLite database
- **Automatic Cleanup**: Database is dropped after each test
- **No Side Effects**: Tests don't affect each other or the production database
- **Fast Execution**: In-memory database makes tests run quickly

## Writing New Tests

### Example Test Structure

```python
def test_feature_name(test_db: Session, test_user: User):
    """Test: Description of what this test verifies."""
    # Arrange: Set up test data
    # Act: Perform the action being tested
    # Assert: Verify the expected outcome
    assert condition, "Error message if assertion fails"
```

### Best Practices

1. **Use Descriptive Names**: Test names should clearly describe what they test
2. **One Assertion Per Concept**: Test one thing at a time
3. **Use Fixtures**: Leverage `conftest.py` fixtures for common setup
4. **Clean Up**: Tests should clean up after themselves (handled by fixtures)
5. **Test Edge Cases**: Include tests for error conditions and boundary cases

## Troubleshooting

### Tests Fail with Import Errors

Ensure you're running tests from the `application/backend` directory:
```bash
cd application/backend
uv run pytest tests/
```

### Database Connection Errors

Tests use in-memory SQLite, so connection errors usually indicate:
- Missing model imports in `conftest.py`
- Incorrect fixture setup

### Fixture Not Found

Ensure fixtures are defined in `conftest.py` and test function parameters match fixture names exactly.

