import { test, expect } from './setup';

test.describe('Edge Cases and Error Handling', () => {

  test('should handle very long messages', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Create a very long message
    const longMessage = 'This is a very long message. '.repeat(100);

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill(longMessage);
    await page.getByRole('button', { name: /send/i }).click();

    // Should handle it gracefully
    await expect(page.getByText(longMessage.substring(0, 50))).toBeVisible();
  });

  test('should prevent sending empty messages', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    const sendButton = page.getByRole('button', { name: /send/i });

    // Button should be disabled initially
    await expect(sendButton).toBeDisabled();

    // Try spaces only
    await page.getByPlaceholder(/What's on your heart/i).fill('   ');
    await expect(sendButton).toBeDisabled();
  });

  test('should handle special characters in messages', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    const specialMessage = 'Testing: @#$%^&*() "quotes" \'apostrophe\' <html> & emoji 😊';

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill(specialMessage);
    await page.getByRole('button', { name: /send/i }).click();

    // Should display correctly
    await expect(page.getByText(specialMessage)).toBeVisible();
  });

  test('should handle rapid message sending', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Send multiple messages quickly
    const messages = ['First', 'Second', 'Third'];

    for (const msg of messages) {
      const input = page.getByPlaceholder(/What's on your heart/i);
      await input.fill(msg);
      await page.getByRole('button', { name: /send/i }).click();
      await page.waitForTimeout(100); // Small delay between sends
    }

    // All messages should appear
    for (const msg of messages) {
      await expect(page.getByText(msg)).toBeVisible();
    }
  });

  test('should handle page refresh during chat', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Send a message
    await page.getByPlaceholder(/What's on your heart/i).fill('Test message');
    await page.getByRole('button', { name: /send/i }).click();

    // Refresh page
    await page.reload();

    // Should still be on chat page but session might be lost
    // (depends on implementation - anonymous sessions might not persist)
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should handle multiline messages', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    const multilineMessage = 'Line 1\nLine 2\nLine 3';

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill(multilineMessage);
    await page.getByRole('button', { name: /send/i }).click();

    // Should preserve line breaks
    await expect(page.getByText(/Line 1/)).toBeVisible();
  });

  test('should disable input while waiting for response', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('Testing');
    await page.getByRole('button', { name: /send/i }).click();

    // Send button should be disabled while waiting
    await expect(page.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Simulate offline mode
    await page.context().setOffline(true);

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('This will fail');
    await page.getByRole('button', { name: /send/i }).click();

    // Should show some error indication
    // (exact behavior depends on implementation)
    await page.waitForTimeout(2000);

    // Restore online
    await page.context().setOffline(false);
  });

  test('should maintain scroll position as messages arrive', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Send a message
    await page.getByPlaceholder(/What's on your heart/i).fill('Test');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for response to complete
    await page.waitForTimeout(5000);

    // Send another
    await page.getByPlaceholder(/What's on your heart/i).fill('Test 2');
    await page.getByRole('button', { name: /send/i }).click();

    // Latest message should be visible (auto-scrolled)
    await expect(page.getByText('Test 2')).toBeVisible();
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await page.getByText('My family is hurting').click();

    // Step 3: Wait for transition, then enter name and skip
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('TestUser');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Now in chat
    await expect(page).toHaveURL(/\/chat/);

    // Click back
    await page.goBack();

    // Should go back to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should validate onboarding data is present before chat', async ({ page }) => {
    // Try to go directly to chat without onboarding
    await page.goto('/chat');

    // Should either redirect or show initial greeting
    // (depends on implementation)
    await page.waitForTimeout(1000);

    // Check that some greeting is shown even without name
    const greeting = page.getByText(/Donna|sweetheart|honey/i);
    await expect(greeting.first()).toBeVisible();
  });

  test('should handle xss attempts in user input', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Try XSS payload
    const xssPayload = '<script>alert("XSS")</script>';

    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill(xssPayload);
    await page.getByRole('button', { name: /send/i }).click();

    // Should be escaped/sanitized, not executed
    await expect(page.getByText(xssPayload)).toBeVisible();

    // No alert should have fired
    await page.waitForTimeout(1000);
  });
});
