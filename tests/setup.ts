import { test as base, Page } from '@playwright/test';

/**
 * Mock chat API responses for reliable, fast tests
 */
async function setupMocks(page: Page) {
  // Mock chat start endpoint
  await page.route('**/api/v1/chat/start', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: `mock-session-${Date.now()}`,
        companionId: 'donna'
      })
    });
  });

  // Mock chat message endpoint (streaming response)
  await page.route('**/api/v1/chat/message', async (route) => {
    const mockResponse = [
      'data: {"type":"content","content":"Hello "}\n\n',
      'data: {"type":"content","content":"sweetheart"}\n\n',
      'data: {"type":"content","content":". I\'m "}\n\n',
      'data: {"type":"content","content":"Donna"}\n\n',
      'data: {"type":"content","content":". "}\n\n',
      'data: {"type":"done"}\n\n'
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: mockResponse
    });
  });

  // Mock auth endpoint
  await page.route('**/api/v1/auth/request-link', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Check your email for a sign-in link.'
      })
    });
  });
}

/**
 * Extended test with automatic API mocking
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Setup mocks before each test
    await setupMocks(page);

    // Run the test
    await use(page);

    // Cleanup happens automatically
  },
});

export { expect } from '@playwright/test';
