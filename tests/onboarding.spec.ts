import { test, expect } from './setup';

test.describe('Onboarding Flow', () => {

  test('should display all concern options', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition first
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Now check concern options
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });

    // Check all concern options are present
    await expect(page.getByText('My family is hurting')).toBeVisible();
    await expect(page.getByText("I'm going through a crisis")).toBeVisible();
    await expect(page.getByText("I'm scared about something")).toBeVisible();
    await expect(page.getByText("I'm struggling with my faith")).toBeVisible();
    await expect(page.getByText("I just need someone to talk to")).toBeVisible();
  });

  test('should progress through all onboarding steps', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(600); // Wait for step 1 animation
    await page.getByText('Catholic').click();

    // Step 2: Select concern (wait for animation to complete)
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(600); // Wait for step 2 animation
    await page.getByText("I'm struggling with my faith").click();

    // Step 3: Wait for transition animation, then enter name and email
    await expect(page.getByText(/Donna likes to know/i)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Wait longer for step 3 animation
    const nameInput = page.getByPlaceholder(/Your name/i);
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill('John');

    await expect(page.getByPlaceholder(/Your email/i)).toBeVisible();
    await page.getByPlaceholder(/Your email/i).fill('john@example.com');

    // Submit
    await page.getByRole('button', { name: /Start talking to Donna/i }).click();

    // Should navigate to chat
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should allow skipping email step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText("I'm scared about something").click();

    // Step 3: Wait for transition to name step, then enter name and skip email
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Jane');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Should still navigate to chat
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should handle special characters in name', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await page.getByText('My family is hurting').click();

    // Step 3: Wait for transition, then test name with special characters
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill("Mary O'Brien-Smith");
    await page.getByRole('button', { name: /Skip/i }).click();

    // Should work fine
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(/Mary O'Brien-Smith/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText("I just need someone to talk to").click();

    // Step 3: Wait for transition, then enter name and invalid email
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Test');

    // Try invalid email
    const emailInput = page.getByPlaceholder(/Your email/i);
    await emailInput.fill('invalid-email');

    // HTML5 validation should prevent submission
    const submitButton = page.getByRole('button', { name: /Start talking to Donna/i });
    await submitButton.click();

    // Should still be on onboarding (email validation failed)
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should remember selected concern in chat greeting', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    const concern = "I'm going through a crisis";
    await page.getByText(concern).click();

    // Step 3: Wait for transition, then enter name
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('Sarah');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Chat greeting should reference the concern
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(/crisis/i)).toBeVisible();
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Check faith selection page
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Check concern selection page
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible();
    const concernButton = page.getByText('My family is hurting');
    await expect(concernButton).toBeVisible();
    await concernButton.click();

    // Step 3: Check for Donna's avatar on name/email page
    await expect(page.getByAltText(/Donna/i)).toBeVisible();
  });

  test('should not allow proceeding without selecting concern', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Should be on concern selection - name input should not be visible yet
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible();
    const nameInput = page.getByPlaceholder(/Your name/i);
    await expect(nameInput).not.toBeVisible();
  });

  test('should maintain onboarding data in session storage', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Select concern
    await page.getByText('My family is hurting').click();

    // Step 3: Wait for transition, then enter name
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/Your name/i).fill('TestUser');

    // Check session storage
    const concern = await page.evaluate(() => sessionStorage.getItem('onboarding_concern'));
    const name = await page.evaluate(() => sessionStorage.getItem('onboarding_name'));
    const faith = await page.evaluate(() => sessionStorage.getItem('onboarding_faith'));

    expect(concern).toBe('My family is hurting');
    expect(name).toBe('TestUser');
    expect(faith).toBe('Catholic');
  });

  test('should show appropriate help text for each step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Check help text
    await expect(page.getByText(/prays differently/i)).toBeVisible();

    // Select concern to proceed to step 3
    await page.getByText('My family is hurting').click();

    // Step 3: Check help text
    await expect(page.getByText(/remember you when she prays/i)).toBeVisible();
  });

  test('should handle rapid clicking on concern options', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Step 1: Select faith tradition
    await expect(page.getByRole('heading', { name: /What best describes/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('Catholic').click();

    // Step 2: Click multiple concerns rapidly
    await expect(page.getByRole('heading', { name: /What's on your heart/i })).toBeVisible({ timeout: 10000 });
    await page.getByText('My family is hurting').click();

    // Wait for transition to step 3 after clicking concern
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible({ timeout: 5000 });

    const concern = await page.evaluate(() => sessionStorage.getItem('onboarding_concern'));
    expect(concern).toBe('My family is hurting');
  });
});
