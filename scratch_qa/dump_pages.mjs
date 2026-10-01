import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Auth & Login
  await page.goto('http://localhost:5173/register');
  const testEmail = `qa_${Date.now()}@test.com`;
  await page.fill('input[name="name"]', 'QA User');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', 'Password123!');
  await page.fill('input[name="confirm-password"]', 'Password123!');
  await page.click('button[type="submit"]', {force: true});
  await page.waitForTimeout(3000);
  
  if (page.url().includes('login')) {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]', {force: true});
      await page.waitForTimeout(3000);
  }

  // Dashboard
  fs.writeFileSync('dash.html', await page.content());
  
  // Projects
  await page.goto('http://localhost:5173/projects/new');
  await page.waitForTimeout(2000);
  fs.writeFileSync('new_project.html', await page.content());
  
  await page.fill('input[name="name"]', 'QA Auto Project');
  await page.fill('textarea[name="description"]', 'Desc');
  await page.click('button[type="submit"]', {force: true});
  await page.waitForTimeout(3000);
  fs.writeFileSync('project_created.html', await page.content());
  const projUrl = page.url();
  
  // Issues
  await page.goto('http://localhost:5173/issues');
  await page.waitForTimeout(2000);
  fs.writeFileSync('issues.html', await page.content());
  
  // Members
  if (projUrl.includes('projects/')) {
      const pid = projUrl.split('/').pop();
      await page.goto(`http://localhost:5173/projects/${pid}/members`);
      await page.waitForTimeout(2000);
      fs.writeFileSync('members.html', await page.content());
      
      await page.goto(`http://localhost:5173/projects/${pid}/analytics`);
      await page.waitForTimeout(2000);
      fs.writeFileSync('analytics.html', await page.content());
  }

  // Global Nav
  await page.goto('http://localhost:5173/settings');
  await page.waitForTimeout(2000);
  fs.writeFileSync('settings.html', await page.content());
  
  await page.goto('http://localhost:5173/team');
  await page.waitForTimeout(2000);
  fs.writeFileSync('team.html', await page.content());

  await page.goto('http://localhost:5173/documents');
  await page.waitForTimeout(2000);
  fs.writeFileSync('documents.html', await page.content());

  await browser.close();
  console.log("Done dumping HTML");
}

run().catch(console.error);
