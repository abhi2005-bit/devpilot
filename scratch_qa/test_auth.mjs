import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("== AREA 1: AUTHENTICATION ==");
  
  await page.goto('http://localhost:5174/login');
  await page.waitForLoadState('networkidle');

  console.log("Checking login page...");
  const hasEmail = await page.isVisible('input[type="email"]');
  const hasPassword = await page.isVisible('input[type="password"]');
  console.log(`Email visible: ${hasEmail}, Password visible: ${hasPassword}`);

  console.log("Checking show/hide password...");
  const toggleBtn = await page.$('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)');
  if (toggleBtn) {
      await toggleBtn.click();
      const isText = await page.isVisible('input[type="text"]');
      console.log(`Password field after toggle is text: ${isText}`);
  } else {
      console.log("Toggle button not found");
  }

  console.log("Testing invalid login...");
  await page.fill('input[type="email"]', 'invalid@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
      await submitBtn.click();
  } else {
      console.log("Submit button not found! Falling back to generic button.");
      await page.click('button:has-text("Sign in")');
  }
  
  await page.waitForTimeout(2000);
  
  // Look for error message
  const bodyText = await page.locator('body').innerText();
  if (bodyText.toLowerCase().includes('invalid') || bodyText.toLowerCase().includes('incorrect') || bodyText.toLowerCase().includes('failed')) {
      console.log("Invalid login rejected correctly.");
  } else {
      console.log("Invalid login did NOT show an expected error message.");
  }
  
  console.log("Testing Registration...");
  await page.goto('http://localhost:5174/register');
  await page.waitForLoadState('networkidle');
  
  const testEmail = `qa_${Date.now()}@test.com`;
  
  // check if elements exist
  try {
      await page.fill('input[type="text"], input[name="name"]', 'QA User');
      await page.fill('input[type="email"]', testEmail);
      
      const passwords = await page.$$('input[type="password"]');
      if (passwords.length >= 2) {
          await passwords[0].fill('Password123!');
          await passwords[1].fill('Password123!');
      } else {
          console.log("Could not find two password fields for registration");
      }
      
      const regBtn = await page.$('button[type="submit"]');
      if (regBtn) await regBtn.click();
      else await page.click('button:has-text("Create account")');
      
  } catch (e) {
      console.log("Error in registration form: ", e.message);
  }

  await page.waitForTimeout(3000);
  
  let currentUrl = page.url();
  console.log(`URL after registration: ${currentUrl}`);
  
  console.log("Testing valid login with newly registered user...");
  await page.goto('http://localhost:5174/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', 'Password123!');
  
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) await loginBtn.click();
  else await page.click('button:has-text("Sign in")');
  
  await page.waitForTimeout(3000);
  
  currentUrl = page.url();
  console.log(`URL after login: ${currentUrl}`);
  
  if (currentUrl.includes('dashboard') || currentUrl === 'http://localhost:5174/') {
      console.log("Login successful, reached dashboard.");
  } else {
      console.log("Login failed or didn't reach dashboard.");
  }
  
  await browser.close();
}

run().catch(console.error);
