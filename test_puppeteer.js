const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.setViewport({width: 1200, height: 800});
    await page.goto('file:///Users/aviralpathak/Desktop/Portfolio/index.html');
    
    // Wait for preloader
    await new Promise(r => setTimeout(r, 2000));
    
    // Scroll to about section
    await page.evaluate(() => {
        document.querySelector('#about').scrollIntoView();
    });
    
    // Wait a bit for transitions
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({path: 'about_section.png'});
    
    const isCurtainOpen = await page.evaluate(() => {
        const left = document.querySelector('.curtain-panel.left');
        return window.getComputedStyle(left).transform;
    });
    
    console.log("Left curtain transform:", isCurtainOpen);
    
    const bgPos = await page.evaluate(() => {
        const heading = document.querySelector('#about-heading');
        return window.getComputedStyle(heading).backgroundPosition;
    });
    console.log("Heading bg-pos:", bgPos);
    
    await browser.close();
})();
