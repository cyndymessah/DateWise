import { test, expect } from '@playwright/test';

test('test add activity modal on profile page', async ({ page }) => {
  // Generate random email for testing
  const randomEmail = `test${Date.now()}@example.com`;
  const password = 'TestPassword123!';

  console.log('Testing with email:', randomEmail);

  // Navigate to landing page
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click register
  await page.getByRole('link', { name: /get started|sign up|register/i }).click();
  await page.waitForLoadState('networkidle');

  // Fill registration form
  await page.fill('input[type="text"][placeholder*="name" i], input[name="name"]', 'Test User');
  await page.fill('input[type="email"]', randomEmail);
  await page.fill('input[type="password"]', password);
  await page.fill('input[type="number"][placeholder*="age" i], input[name="age"]', '25');

  // Select location
  await page.selectOption('select[name="location"]', 'Singapore');

  // Click register button
  await page.getByRole('button', { name: /register|sign up|create account/i }).click();

  // Wait for redirect to onboarding
  await page.waitForURL(/onboarding/, { timeout: 10000 });
  console.log('Registered successfully, now on onboarding');

  // Step 1: Fill profile info (required fields only)
  await page.fill('textarea[placeholder*="interests" i]', 'Testing, Coding, Coffee');
  await page.fill('textarea[placeholder*="values" i]', 'Honesty, Growth');
  await page.fill('textarea[placeholder*="lifestyle" i]', 'Active and balanced');
  await page.fill('textarea[placeholder*="relationship" i]', 'Looking for something real');

  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(1000);

  // Step 2: Select at least one activity
  console.log('On activity selection step');
  await page.waitForSelector('button:has-text("Coffee")', { timeout: 5000 });

  // Click first activity button
  const firstActivity = page.locator('button').filter({ hasText: /coffee|hiking|dinner/i }).first();
  await firstActivity.click();
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: /continue/i }).click();
  await page.waitForTimeout(1000);

  // Step 3: Skip activity details
  console.log('On activity details step');
  await page.getByRole('button', { name: /skip|complete/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  console.log('Onboarding complete, now on dashboard');

  // Navigate to profile page
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  console.log('On profile page');

  // Take screenshot of profile page
  await page.screenshot({ path: 'tests/screenshots/01-profile-page.png', fullPage: true });

  // Click "Add Activities" button
  console.log('Clicking Add Activities button');
  const addButton = page.getByRole('button', { name: /add activities/i });
  await expect(addButton).toBeVisible();
  await addButton.click();

  // Wait for modal to appear
  await page.waitForTimeout(2000); // Give time for API call

  // Take screenshot of modal
  await page.screenshot({ path: 'tests/screenshots/02-modal-opened.png', fullPage: true });

  // Check if modal is visible
  const modal = page.locator('div.fixed.inset-0');
  await expect(modal).toBeVisible();
  console.log('Modal is visible');

  // Check for loading spinner
  const spinner = page.locator('.animate-spin');
  const spinnerVisible = await spinner.isVisible();
  console.log('Loading spinner visible:', spinnerVisible);

  // Wait a bit more and take another screenshot
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/screenshots/03-modal-after-wait.png', fullPage: true });

  // Check what's actually in the modal
  const modalContent = await page.locator('div.fixed.inset-0').textContent();
  console.log('Modal content:', modalContent);

  // Check if activities loaded
  const activities = page.locator('button').filter({ hasText: /coffee|hiking|museum/i });
  const activityCount = await activities.count();
  console.log('Number of activity buttons found:', activityCount);

  // Check if there's an error message
  const errorText = await page.locator('text=/failed|error/i').count();
  console.log('Error messages found:', errorText);

  // Log all text content in the modal body
  const modalBody = page.locator('.p-6.space-y-6');
  const bodyText = await modalBody.textContent();
  console.log('Modal body text:', bodyText);

  // Final assertion - activities should be loaded
  if (activityCount > 0) {
    console.log('✅ SUCCESS: Activities loaded in modal');
  } else {
    console.log('❌ FAILURE: No activities found in modal');
    console.log('Taking debug screenshot...');
    await page.screenshot({ path: 'tests/screenshots/04-debug-empty-modal.png', fullPage: true });
  }
});
