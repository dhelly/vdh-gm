// ==UserScript==
// @name         VDH Simulator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Simulates Video DownloadHelper functionality: network monitoring and video detection
// @author       Antigravity
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log('[VDH Sim] Starting Video DownloadHelper Simulator...');

    // --- State ---
    const detectedMedia = new Map(); // URL -> info object
    let uiButton = null;
    let uiList = null;
    let badge = null;

    // --- Config ---
    const MEDIA_EXTENSIONS = /\.(mp4|webm|flv|m3u8|mpd|mov|avi|mkv)(\?|$)/i;
    const MANIFEST_EXTENSIONS = /\.(m3u8|mpd)(\?|$)/i;

    // --- Modules ---

    // 1. Network Interceptor
    const originalFetch = window.fetch;
    const originalOpen = XMLHttpRequest.prototype.open;

    function processUrl(url, method = 'GET') {
        if (!url) return;
        // Resolve relative URLs
        const absoluteUrl = new URL(url, window.location.href).href;

        if (MEDIA_EXTENSIONS.test(absoluteUrl)) {
            console.log(`[VDH Sim] Detected Media: ${absoluteUrl}`);
            addMedia(absoluteUrl);
        }
    }

    // Hook Fetch
    window.fetch = async function (...args) {
        const [resource] = args;
        let url;
        if (resource instanceof Request) {
            url = resource.url;
        } else {
            url = resource;
        }
        processUrl(url);
        return originalFetch.apply(this, args);
    };

    // Hook XHR
    XMLHttpRequest.prototype.open = function (method, url) {
        processUrl(url, method);
        return originalOpen.apply(this, arguments);
    };

    // 2. DOM Observer
    function scanDom() {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            if (v.src) processUrl(v.src);
            v.querySelectorAll('source').forEach(s => {
                if (s.src) processUrl(s.src);
            });
        });
    }

    const observer = new MutationObserver((mutations) => {
        scanDom();
    });

    // Start observing once body is available
    function initObserver() {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
            scanDom(); // Initial scan
        } else {
            requestAnimationFrame(initObserver);
        }
    }

    // 3. UI Controller
    function createUI() {
        if (uiButton) return; // Already created

        // Create Button
        uiButton = document.createElement('div');
        uiButton.id = 'vdh-sim-button';
        Object.assign(uiButton.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: '#333',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: '999999',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #666',
            transition: 'transform 0.2s',
            opacity: '0.5' // Dim when inactive
        });

        // Icon (Simple 3 dots colored)
        uiButton.innerHTML = `<span style="font-size:20px;">🎬</span>`;

        // Badge
        badge = document.createElement('div');
        Object.assign(badge.style, {
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            visibility: 'hidden'
        });
        badge.innerText = '0';
        uiButton.appendChild(badge);

        // List Container (Popup)
        uiList = document.createElement('div');
        uiList.id = 'vdh-sim-list';
        Object.assign(uiList.style, {
            position: 'fixed',
            top: '70px',
            right: '20px',
            width: '300px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: '999999',
            display: 'none',
            flexDirection: 'column',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '10px',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            color: '#333'
        });

        // Toggle list
        uiButton.addEventListener('click', () => {
            uiList.style.display = uiList.style.display === 'none' ? 'flex' : 'none';
        });

        document.body.appendChild(uiButton);
        document.body.appendChild(uiList);
    }

    function updateBadge() {
        const count = detectedMedia.size;
        if (!uiButton) return;

        if (count > 0) {
            uiButton.style.opacity = '1';
            uiButton.style.borderColor = '#00aaff'; // Active color
            badge.style.visibility = 'visible';
            badge.innerText = count > 9 ? '9+' : count;
        } else {
            uiButton.style.opacity = '0.5';
            uiButton.style.borderColor = '#666';
            badge.style.visibility = 'hidden';
        }
    }

    function addMedia(url) {
        if (detectedMedia.has(url)) return;

        // Metadata
        const type = MANIFEST_EXTENSIONS.test(url) ? 'STREAM' : 'FILE';
        const filename = url.split('/').pop().split('?')[0] || 'video';

        detectedMedia.set(url, { type, filename, url });

        // Update UI
        if (!uiList) createUI();
        updateBadge();

        const item = document.createElement('div');
        Object.assign(item.style, {
            padding: '10px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        });

        // Title
        const title = document.createElement('div');
        title.style.fontWeight = 'bold';
        title.style.wordBreak = 'break-all';
        title.innerText = filename;
        item.appendChild(title);

        // Info
        const info = document.createElement('div');
        info.style.fontSize = '12px';
        info.style.color = '#666';
        info.innerText = `Type: ${type}`;
        item.appendChild(info);

        // Actions
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';

        if (type === 'FILE') {
            const btn = createBtn('Download', '#007bff');
            btn.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            actions.appendChild(btn);
        } else {
            const btn = createBtn('Copy yt-dlp', '#28a745');
            btn.onclick = () => {
                // Determine output extension
                const ext = url.includes('.m3u8') ? 'mp4' : 'mkv';

                // Construct basic headers
                // yt-dlp is smarter and handles many things, but we still pass Referer/UA to be safe.

                const referer = window.location.href;
                const userAgent = navigator.userAgent;
                const cookies = document.cookie;

                // Build yt-dlp command
                // --referer: dedicated flag
                // --user-agent: dedicated flag
                // Use double quotes for best cross-platform shell compatibility

                let cmd = `yt-dlp "${url}"`;
                cmd += ` --referer "${referer}"`;
                cmd += ` --user-agent "${userAgent.replace(/"/g, '\\"')}"`;

                // Using --add-header for cookie is viable or saving to file, but simplistic approach here:
                if (cookies) {
                    // Escaping cookies for shell is extremely hard due to spaces and special chars.
                    // We attempt a best effort with --add-header "Cookie: ..."
                    cmd += ` --add-header "Cookie:${cookies.replace(/"/g, '\\"')}"`;
                }

                // Force output format name with detected title
                // We wrap filename in quotes to handle spaces
                cmd += ` -o "${filename}.${ext}"`;

                GM_setClipboard(cmd);
                alert(`yt-dlp command for "${filename}" copied!`);
            };
            actions.appendChild(btn);
        }

        const copyUrl = createBtn('Copy URL', '#6c757d');
        copyUrl.onclick = () => {
            GM_setClipboard(url);
            alert('URL copied!');
        };
        actions.appendChild(copyUrl);

        item.appendChild(actions);
        uiList.appendChild(item);
    }

    function createBtn(text, color) {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            backgroundColor: color,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
        });
        return btn;
    }

    // --- Init ---
    // Wait for body to inject UI
    const waitForBody = setInterval(() => {
        if (document.body) {
            clearInterval(waitForBody);
            createUI();
            initObserver();
        }
    }, 100);

})();
