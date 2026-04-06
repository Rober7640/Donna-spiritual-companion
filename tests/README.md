# Test Suite

End-to-end tests for Benedara spiritual companion app using Playwright.

## Test Files

### conversation-flow.spec.ts
Tests the core conversation functionality:
- Landing page display
- Navigation to chat
- Sending and receiving messages
- Streaming responses
- Typing indicators
- Conversation history
- Anonymous chat flow

### onboarding.spec.ts
Tests the onboarding process:
- Concern selection
- Name entry
- Email capture (optional)
- Skip functionality
- Data persistence
- Validation

### edge-cases.spec.ts
Tests error handling and edge cases:
- Long messages
- Special characters
- XSS protection
- Network errors
- Rapid interactions
- Browser navigation
- Empty/invalid input

## Running Tests

```bash
# Run all tests in headless mode
npm test

# Run tests with UI (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/conversation-flow.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Run tests with trace
npx playwright test --trace on
```

## Viewing Test Results

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: http://localhost:5000
- Test directory: ./tests
- Automatically starts dev server before tests
- Screenshots on failure
- Trace on first retry

## Writing New Tests

Follow these patterns:

1. **Arrange** - Set up test data (session storage, navigation)
2. **Act** - Perform user actions
3. **Assert** - Verify expected outcomes

Example:
```typescript
test('should do something', async ({ page }) => {
  // Arrange
  await page.goto('/chat');

  // Act
  await page.getByRole('button', { name: 'Send' }).click();

  // Assert
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Best Practices

- Use semantic selectors (role, label, text) over CSS/XPath
- Wait for elements with `expect().toBeVisible()` rather than `waitForTimeout`
- Test user flows, not implementation details
- Keep tests independent - each test should work in isolation
- Use descriptive test names that explain what is being tested

## CI/CD

Tests are configured to run in CI with:
- Retries on failure
- Single worker (sequential execution)
- Automatic server startup
