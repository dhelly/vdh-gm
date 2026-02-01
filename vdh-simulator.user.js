// ==UserScript==
// @name         VDH Simulator (YT + Hotmart)
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Video DownloadHelper with yt-dlp - YouTube + Hotmart (Robust)
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
    const YOUTUBE_PATTERNS = [
        /youtube\.com\/watch/i,
        /youtu\.be\//i,
        /youtube\.com\/embed\//i,
        /youtube\.com\/v\//i,
        /youtube\.com\/shorts\//i
    ];

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

    // 2. YouTube Detection (SPA robust)
    function detectYouTube() {
        const currentUrl = window.location.href;
        const hostname = window.location.hostname;

        // Check if we're on YouTube
        if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
            return;
        }

        // Check if it's a video page
        const isYouTubeVideo = YOUTUBE_PATTERNS.some(pattern => pattern.test(currentUrl));
        if (!isYouTubeVideo) {
            return;
        }

        // Extract video ID
        let videoId = '';
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('v')) {
            videoId = urlParams.get('v');
        } else if (currentUrl.includes('youtu.be/')) {
            videoId = currentUrl.split('youtu.be/')[1].split('?')[0].split('/')[0];
        } else if (currentUrl.includes('/embed/')) {
            videoId = currentUrl.split('/embed/')[1].split('?')[0].split('/')[0];
        } else if (currentUrl.includes('/shorts/')) {
            videoId = currentUrl.split('/shorts/')[1].split('?')[0].split('/')[0];
        }

        if (!videoId) {
            console.log('[VDH Sim] YouTube page detected but no video ID found');
            return;
        }

        // Use video ID as unique key to avoid duplicates
        const uniqueKey = `youtube_${videoId}`;
        if (detectedMedia.has(uniqueKey)) {
            return;
        }

        console.log('[VDH Sim] YouTube video detected:', videoId);

        // Add YouTube video
        addMedia(uniqueKey, {
            type: 'YOUTUBE',
            filename: `YouTube_${videoId}`,
            url: currentUrl, // We use the page URL for yt-dlp
            videoId: videoId
        });
    }

    // 3. DOM Observer
    function scanDom() {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
            if (v.src) processUrl(v.src);
            v.querySelectorAll('source').forEach(s => {
                if (s.src) processUrl(s.src);
            });
        });

        // Check for YouTube on every DOM scan
        detectYouTube();
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

    // 4. UI Controller
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

        // Icon
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
            width: '350px',
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

    function addMedia(url, customData = null) {
        if (detectedMedia.has(url)) return;

        // Metadata detection
        let type, filename, videoId;

        if (customData) {
            type = customData.type || 'FILE';
            filename = customData.filename || 'video';
            videoId = customData.videoId || null;
        } else {
            type = MANIFEST_EXTENSIONS.test(url) ? 'STREAM' : 'FILE';
            filename = url.split('/').pop().split('?')[0] || 'video';

            // Simple filename cleanup for streams
            if (filename === 'master.m3u8' || filename === 'manifest.mpd') {
                try {
                    // Try browser title as fallback
                    filename = document.title.split(' - ')[0].trim().replace(/[^a-z0-9]/gi, '_');
                } catch (e) { }
            }
        }

        detectedMedia.set(url, { type, filename, url, videoId, ...(customData || {}) });

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
        actions.style.flexWrap = 'wrap';

        if (type === 'FILE') {
            const btnDirect = createBtn('Download', '#007bff');
            btnDirect.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            actions.appendChild(btnDirect);

            const btnYtdlp = createBtn('yt-dlp cmd', '#28a745');
            btnYtdlp.onclick = () => {
                const cmd = `yt-dlp -o "%(title)s.%(ext)s" "${url}"`;
                GM_setClipboard(cmd);
                alert('Comando yt-dlp copiado!');
            };
            actions.appendChild(btnYtdlp);

        } else if (type === 'YOUTUBE') {
            // YouTube Specific Buttons

            // Best Quality
            const btnBest = createBtn('yt-dlp (Melhor)', '#FF0000');
            btnBest.onclick = () => {
                const cmd = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "%(title)s.%(ext)s" "${customData.url}"`;
                GM_setClipboard(cmd);
                alert('Comando yt-dlp (Melhor Qualidade) copiado!');
            };
            actions.appendChild(btnBest);

            // Audio Only (User Request)
            const btnAudio = createBtn('Áudio (MP3)', '#17a2b8');
            btnAudio.onclick = () => {
                const cmd = `yt-dlp --extractor-args "youtube:player_client=android,web" -x --audio-format mp3 --audio-quality 0 -o "%(title)s.%(ext)s" "${customData.url}"`;
                GM_setClipboard(cmd);
                alert('Comando yt-dlp (Áudio MP3) copiado!');
            };
            actions.appendChild(btnAudio);

            const btnLow = createBtn('720p', '#990000');
            btnLow.onclick = () => {
                const cmd = `yt-dlp --extractor-args "youtube:player_client=android,web" -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "%(title)s.%(ext)s" "${customData.url}"`;
                GM_setClipboard(cmd);
                alert('Comando yt-dlp (720p) copiado!');
            };
            actions.appendChild(btnLow);


        } else {
            // GENERIC STREAM (m3u8/mpd) - Uses ROBUST injection (Hotmart friendly)

            const btnRobust = createBtn('Copy yt-dlp', '#28a745');
            btnRobust.onclick = () => {
                // Determine output extension
                const ext = url.includes('.m3u8') ? 'mp4' : 'mkv';

                // Construct basic headers manually
                const referer = window.location.href;
                const userAgent = navigator.userAgent;
                const cookies = document.cookie;

                // Build yt-dlp command
                let cmd = `yt-dlp "${url}"`;
                cmd += ` --referer "${referer}"`;
                cmd += ` --user-agent "${userAgent.replace(/"/g, '\\"')}"`;

                // Inject browser cookies manually via header (No local file dependency)
                if (cookies) {
                    cmd += ` --add-header "Cookie:${cookies.replace(/"/g, '\\"')}"`;
                }

                // Force output format name with detected title
                cmd += ` -o "${filename}.${ext}"`;

                GM_setClipboard(cmd);
                alert(`yt-dlp command for "${filename}" copied!`);
            };
            actions.appendChild(btnRobust);

            // Audio Only for Streams (Added Feature)
            const btnAudio = createBtn('Copy Audio', '#17a2b8');
            btnAudio.onclick = () => {
                const referer = window.location.href;
                const userAgent = navigator.userAgent;
                const cookies = document.cookie;

                let cmd = `yt-dlp "${url}"`;
                cmd += ` --referer "${referer}"`;
                cmd += ` --user-agent "${userAgent.replace(/"/g, '\\"')}"`;
                if (cookies) {
                    cmd += ` --add-header "Cookie:${cookies.replace(/"/g, '\\"')}"`;
                }

                cmd += ` -x --audio-format mp3 -o "${filename}.mp3"`;

                GM_setClipboard(cmd);
                alert(`yt-dlp audio command for "${filename}" copied!`);
            };
            actions.appendChild(btnAudio);
        }

        const copyUrl = createBtn('Copy URL', '#6c757d');
        copyUrl.onclick = () => {
            GM_setClipboard(customData?.url || url);
            alert('URL copiada!');
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
            // Initial detection (important for when script loads after page)
            detectYouTube();
        }
    }, 100);

    // Also detect on URL changes (for SPA navigation)
    let lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            console.log('[VDH Sim] URL changed, re-scanning...');
            detectYouTube();
        }
    }, 1000);

})();
