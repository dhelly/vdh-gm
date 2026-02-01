const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Read the userscript
const scriptContent = fs.readFileSync('/home/jaqueline/pessoal/vdh-gm/vdh-simulator.user.js', 'utf8');

// Read the test page
const htmlContent = fs.readFileSync('/home/jaqueline/pessoal/vdh-gm/test-page.html', 'utf8');

// Mock GM_setClipboard
const GM_setClipboard = (text) => console.log('[GM_setClipboard]', text);

// Setup JSDOM
const dom = new JSDOM(htmlContent, {
    url: "file:///home/jaqueline/pessoal/vdh-gm/test-page.html",
    runScripts: "dangerously",
    resources: "usable"
});

const { window } = dom;
const { document } = window;

// Inject GM_setClipboard into window
window.GM_setClipboard = GM_setClipboard;

// Inject the UserScript content manually since JSDOM doesn't run .user.js files automatically
// We wrap it in a function to pass the mocked context if needed, but the script relies on 'window' global
console.log('--- Loading Userscript ---');
const scriptElement = document.createElement('script');
scriptElement.textContent = scriptContent;
document.head.appendChild(scriptElement);

// Wait a bit for observers and initial execution
setTimeout(() => {
    console.log('--- Simulation Start ---');

    console.log('1. Checking UI Injection...');
    const btn = document.getElementById('vdh-sim-button');
    if (btn) console.log('SUCCESS: UI Button found.');
    else console.error('FAIL: UI Button not found.');

    console.log('2. Simulating User interactions...');
    // Trigger the HLS button
    window.simulateHLS();
    window.simulateDASH();
    
    // Trigger Video Injection
    window.injectVideo();

    // Check internal state (indirectly via UI badge or list)
    setTimeout(() => {
        console.log('3. Checking Results...');
        const list = document.getElementById('vdh-sim-list');
        if (list) {
            console.log('List items found:', list.children.length);
            for(let child of list.children) {
                console.log(' - Found item:', child.textContent.slice(0, 50) + '...');
            }
        }
        
         const badge = btn.querySelector('div'); // The badge is the only div child
         if(badge) console.log('Badge count:', badge.innerText);

    }, 500);

}, 500);
