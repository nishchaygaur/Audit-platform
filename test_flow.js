const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/signin');
  
  // Submit existing test@example.com
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'password123');
  
  console.log('Clicking submit...');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  console.log("Current URL after sign in:", page.url());
  
  // Wait to see if it redirects back
  await new Promise(r => setTimeout(r, 2000));
  console.log("Current URL after 2s:", page.url());

  // Check if we can see the "Select a workspace" text
  const text = await page.evaluate(() => {
    return document.body.innerText;
  });
  console.log("Found text 'Select a workspace':", text.includes('Select a workspace'));
  
  await browser.close();
})();
