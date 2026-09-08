const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/signin');
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Sign up'));
    if (btn) btn.click();
  });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 500));
  
  await page.type('input[placeholder="Jane Doe"]', 'Test User');
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'password123');
  
  const [response] = await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(e => console.log('Navigation timeout')),
    page.click('button[type="submit"]')
  ]);
  
  console.log("Current URL after submit:", page.url());
  
  const errorMsg = await page.evaluate(() => {
    const err = document.querySelector('.text-red-600');
    return err ? err.textContent : null;
  });
  console.log("Error shown on page:", errorMsg);
  
  await browser.close();
})();
