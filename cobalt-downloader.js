/**
 * Cobalt Tools Video Downloader
 * Standalone JavaScript version (converted from UserScript)
 * @version 1.2
 * @description Download videos from supported sites using cobalt.tools with automated download actions
 */

(function() {
    'use strict';

    const COBALT_DELAY = 2500; // Milliseconds to wait for Cobalt page to initialize
    const SUPPORTED_DOMAINS = [
        'bilibili.com',
        'dailymotion.com',
        'facebook.com',
        'instagram.com',
        'pinterest.com',
        'reddit.com',
        'soundcloud.com',
        'streamable.com',
        'tiktok.com',
        'tumblr.com',
        'twitch.tv',
        'twitter.com',
        'mobile.twitter.com',
        'x.com',
        'vxtwitter.com',
        'fixvx.com',
        'vine.co',
        'vimeo.com',
        'vk.com',
        'youtube.com',
        'music.youtube.com',
        'm.youtube.com',
        'xiaohongshu.com',
        'xhslink.com',
        'cobalt.tools'
    ];

    /**
     * Show notification to user
     * @param {string} title - Notification title
     * @param {string} text - Notification text
     * @param {number} timeout - Auto-dismiss timeout in ms
     */
    function showNotification(title, text, timeout = 3000) {
        // Try to use browser Notification API if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: text, tag: 'cobalt-tools' });
            setTimeout(() => {
                const notifications = document.querySelectorAll('[data-cobalt-notification]');
                notifications.forEach(n => n.remove());
            }, timeout);
        } else {
            // Fallback: create custom notification element
            createCustomNotification(title, text, timeout);
        }
    }

    /**
     * Create a custom notification element
     * @param {string} title - Notification title
     * @param {string} text - Notification text
     * @param {number} timeout - Auto-dismiss timeout in ms
     */
    function createCustomNotification(title, text, timeout = 3000) {
        const notification = document.createElement('div');
        notification.setAttribute('data-cobalt-notification', 'true');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: #fff;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">${title}</div>
            <div style="font-size: 14px;">${text}</div>
        `;
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        
        if (!document.querySelector('style[data-cobalt-animations]')) {
            style.setAttribute('data-cobalt-animations', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-dismiss
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, timeout);
    }

    /**
     * Check if current domain is supported
     * @returns {boolean}
     */
    function isSupportedDomain() {
        return SUPPORTED_DOMAINS.some(domain => 
            location.hostname === domain || 
            location.hostname.endsWith('.' + domain)
        );
    }

    /**
     * Open Cobalt with current URL
     */
    function openCobalt() {
        const encodedUrl = encodeURIComponent(location.href);
        const cobaltUrl = `https://cobalt.tools/?url=${encodedUrl}#${encodedUrl}`;

        // Open in new tab
        const newTab = window.open(cobaltUrl, '_blank');
        
        if (newTab) {
            newTab.focus();
            showNotification(
                'Cobalt Tools',
                'Opening download page...',
                3000
            );
        } else {
            showNotification(
                'Cobalt Tools',
                'Pop-up blocked. Please allow pop-ups for this site.',
                3000
            );
            console.error('[Cobalt Downloader] Failed to open new tab');
        }
    }

    /**
     * Handle Cobalt page logic - process video URL and trigger download
     */
    function handleCobaltPage() {
        const sourceUrl = location.hash.slice(1) || 
                         new URLSearchParams(location.search).get('url');

        if (!sourceUrl) {
            console.log('[Cobalt Downloader] No source URL found');
            return;
        }

        console.log('[Cobalt Downloader] Processing URL:', sourceUrl);

        // Poll until the input field and download button appear
        const initCobalt = setInterval(() => {
            const input = document.getElementById('link-area');
            const downloadBtn = document.getElementById('download-button');

            if (input && downloadBtn) {
                clearInterval(initCobalt);
                console.log('[Cobalt Downloader] Found input and download button');

                // Set the input value
                input.value = decodeURIComponent(sourceUrl);
                input.dispatchEvent(new Event('input', { bubbles: true }));

                // Click download button
                setTimeout(() => {
                    downloadBtn.click();
                    console.log('[Cobalt Downloader] Clicked download button');
                }, 300);

                // Poll for save/download button
                const waitForSave = setInterval(() => {
                    const saveBtn = document.querySelector(
                        '#button-save-download, [data-testid="save-download"], button[aria-label*="save" i], button[aria-label*="download" i]'
                    );

                    if (saveBtn && !saveBtn.disabled) {
                        clearInterval(waitForSave);
                        saveBtn.click();
                        console.log('[Cobalt Downloader] Clicked save/download button');

                        // Attempt to close tab
                        setTimeout(() => {
                            try {
                                window.close();
                            } catch (e) {
                                console.log('[Cobalt Downloader] Could not close tab:', e.message);
                            }
                        }, 1500);
                    }
                }, 200);

                // Safety timeout: stop after 15 seconds
                setTimeout(() => clearInterval(waitForSave), 15000);
            }
        }, 300);

        // Safety timeout: stop polling after 15 seconds
        setTimeout(() => clearInterval(initCobalt), 15000);
    }

    /**
     * Add download button to page UI
     */
    function addDownloadButton() {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'cobalt-downloader-container';
        buttonContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        // Create button
        const button = document.createElement('button');
        button.id = 'cobalt-downloader-btn';
        button.textContent = '📥 Download with Cobalt';
        button.style.cssText = `
            padding: 12px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            min-width: 180px;
        `;

        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            button.style.transform = 'translateY(0)';
        });

        // Add click handler
        button.addEventListener('click', openCobalt);

        buttonContainer.appendChild(button);
        document.body.appendChild(buttonContainer);
    }

    /**
     * Initialize the script based on current page
     */
    function init() {
        // If on Cobalt page, handle video download
        if (location.hostname === 'cobalt.tools') {
            handleCobaltPage();
            return;
        }

        // If on supported video site, add download button
        if (isSupportedDomain()) {
            // Wait for DOM to be ready
            if (document.body) {
                addDownloadButton();
            } else {
                document.addEventListener('DOMContentLoaded', addDownloadButton);
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for use in browser console or other scripts
    window.CobaltDownloader = {
        openCobalt,
        showNotification,
        init
    };

    console.log('[Cobalt Downloader] Initialized. Use window.CobaltDownloader to access functions.');
})();
