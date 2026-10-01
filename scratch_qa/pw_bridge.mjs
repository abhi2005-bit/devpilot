import { chromium } from 'playwright';
import http from 'http';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let page = await context.newPage();

  const server = http.createServer(async (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { action, arg1, arg2, options } = payload;
        
        let result = null;
        if (action === 'goto') {
          await page.goto(arg1, options);
        } else if (action === 'click') {
          await page.click(arg1, options);
        } else if (action === 'fill') {
          await page.fill(arg1, arg2, options);
        } else if (action === 'content') {
          result = await page.content();
        } else if (action === 'url') {
          result = page.url();
        } else if (action === 'eval') {
          result = await page.evaluate(arg1);
        } else if (action === 'isVisible') {
          result = await page.isVisible(arg1);
        } else if (action === 'waitForTimeout') {
          await page.waitForTimeout(arg1);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  });

  server.listen(9999, () => {
    console.log('Playwright server listening on 9999');
  });
})();
