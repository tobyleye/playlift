# Conversion Handler Tests

## Overview
This test file (`conversion_test.go`) contains comprehensive unit tests for the `GetAllConversions` handler.

## Test Coverage

### 1. `TestGetAllConversions_Success`
Tests that the handler successfully returns all conversions for a user with multiple conversions.

### 2. `TestGetAllConversions_EmptyResult`
Tests that the handler returns an empty array when a user has no conversions.

### 3. `TestGetAllConversions_OrderByCreatedAtDesc`
Tests that conversions are returned in descending order by creation date (newest first).

### 4. `TestGetAllConversions_OnlyReturnsUserConversions`
Tests that the handler only returns conversions belonging to the authenticated user and not other users' conversions.

### 5. `TestGetAllConversions_ResponseStructure`
Tests that the response contains all expected fields with correct data types.

## Running the Tests

### Prerequisites
You need a test MySQL database. Create it with:
```bash
mysql -u root -p -e "CREATE DATABASE playlift_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'test'@'localhost' IDENTIFIED BY 'test';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON playlift_test.* TO 'test'@'localhost';"
```

### Run all tests
```bash
go test ./handlers -v
```

### Run specific test
```bash
go test ./handlers -v -run TestGetAllConversions_Success
```

### Run with coverage
```bash
go test ./handlers -v -cover
```

### Run with detailed coverage report
```bash
go test ./handlers -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## Test Setup

The tests use:
- **Real database**: Tests connect to a MySQL test database for integration testing
- **Gorilla sessions**: For session management
- **Echo framework**: For HTTP context
- **Testify**: For assertions (cleaner test syntax)

## Improving the Tests

### Option 1: Use SQLMock (Faster, No Database Required)
For unit tests without a real database:
```bash
go get github.com/DATA-DOG/go-sqlmock
```

Then modify `setupTestDB` to use sqlmock instead of a real database.

### Option 2: Use Testcontainers (Recommended)
For truly isolated integration tests:
```bash
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/mysql
```

### Option 3: Use In-Memory SQLite
For faster tests (requires schema compatibility):
```bash
go get gorm.io/driver/sqlite
```

## Bug Fix
The test revealed a bug in the original handler code where `.Order("created_at DESC")` was called after `.Find()`. This has been fixed - the order clause now comes before the Find call.

## Extending the Tests

To add more test cases:
1. Create a new test function: `func TestGetAllConversions_YourCase(t *testing.T)`
2. Use the helper functions: `setupTestDB`, `setupTestContext`, `seedTestData`
3. Follow the pattern: Setup → Execute → Assert → Cleanup

Example:
```go
func TestGetAllConversions_WithDifferentStatuses(t *testing.T) {
    db := setupTestDB(t)
    if db == nil {
        t.Skip("Skipping test: database not available")
    }
    
    userID := "test-user-statuses"
    handlers := Handlers{Db: db}
    
    // Your test logic here
    
    // Always cleanup
    db.Where("user_id = ?", userID).Delete(&models.PlaylistConversion{})
}
```
