import { test, expect } from './setup';

test.describe('Conversation Flow', () => {

  test('should load landing page with Donna', async ({ page }) => {
    await page.goto('/');

    // Check that Donna's name and info are visible
    await expect(page.getByRole('heading', { name: /Donna, 67/i })).toBeVisible();
    await expect(page.getByText(/I raised four children and buried one/i)).toBeVisible();
    await expect(page.getByText(/Donna is available/i)).toBeVisible();

    // Check CTA button (there are multiple, check first one)
    await expect(page.getByRole('button', { name: /Talk to Donna/i }).first()).toBeVisible();
  });

  test('should navigate to onboarding when clicking Talk to Donna', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Talk to Donna/i }).first().click();

    // Should be on onboarding page (Step 1: faith selection)
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
  });

  test('should complete onboarding flow and start conversation', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select a concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText(/My family is hurting/i).click();

    // Step 3: Wait for transition, then should ask for name
    await expect(page.getByText(/Donna likes to know/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Sarah');

    // Skip email for anonymous flow
    await page.getByRole('button', { name: /Skip/i }).click();

    // Should redirect to chat
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should display initial greeting in chat', async ({ page }) => {
    // Complete onboarding first
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText(/My family is hurting/i).click();

    // Step 3: Wait for transition, then enter name and skip
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Sarah');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Wait for chat page
    await expect(page).toHaveURL(/\/chat/);

    // Check initial greeting mentions the user's name and concern
    await expect(page.getByText(/Sarah/i)).toBeVisible();
    await expect(page.getByText(/I'm Donna/i)).toBeVisible();
  });

  test('should allow user to send a message', async ({ page }) => {
    // Set up session storage for quick start
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
      sessionStorage.setItem('onboarding_concern', 'Testing');
    });
    await page.reload();

    // Type and send a message
    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('I need someone to talk to');
    await page.getByRole('button', { name: /send/i }).click();

    // Message should appear in chat
    await expect(page.getByText('I need someone to talk to')).toBeVisible();
  });

  test('should show typing indicator when waiting for response', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Send a message
    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('Hello');
    await page.getByRole('button', { name: /send/i }).click();

    // Should see typing indicator
    await expect(page.getByText(/Donna is typing/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display Donna response with streaming', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'Sarah');
    });
    await page.reload();

    // Send a message
    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('I am feeling worried');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for response to start appearing (streaming)
    // The response should contain some text after streaming completes
    await page.waitForSelector('text=/sweetheart|honey|Sarah/i', { timeout: 15000 });
  });

  test('should show conversation history', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Send first message
    let input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('First message');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Send second message
    input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('Second message');
    await page.getByRole('button', { name: /send/i }).click();

    // Both messages should be visible
    await expect(page.getByText('First message')).toBeVisible();
    await expect(page.getByText('Second message')).toBeVisible();
  });

  test('should display header with Donna info and status', async ({ page }) => {
    await page.goto('/chat');

    // Check header elements
    await expect(page.getByRole('heading', { name: /Donna/i })).toBeVisible();
    await expect(page.getByText(/Here with you/i)).toBeVisible();
  });

  test('should have end conversation button', async ({ page }) => {
    await page.goto('/chat');

    // Check for end button
    const endButton = page.getByRole('button', { name: /^Step away for now$/i });
    await expect(endButton).toBeVisible();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    const sendButton = page.getByRole('button', { name: /send/i });

    // Button should be disabled when empty
    await expect(sendButton).toBeDisabled();

    // Type something
    await page.getByPlaceholder(/What's on your heart/i).fill('Hello');

    // Button should be enabled
    await expect(sendButton).toBeEnabled();
  });

  test('should show avatar for Donna messages', async ({ page }) => {
    await page.goto('/chat');
    await page.evaluate(() => {
      sessionStorage.setItem('onboarding_name', 'TestUser');
    });
    await page.reload();

    // Check for Donna's avatar in the greeting
    const avatar = page.getByAltText(/Donna/i).first();
    await expect(avatar).toBeVisible();
  });

  test('should allow anonymous chat without email', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText(/I'm going through a crisis/i).click();

    // Step 3: Wait for transition, then complete onboarding without email
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Anonymous');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Should still be able to chat
    await expect(page).toHaveURL(/\/chat/);

    // Send a message
    const input = page.getByPlaceholder(/What's on your heart/i);
    await input.fill('Testing anonymous chat');
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText('Testing anonymous chat')).toBeVisible();
  });
});
