// LeetCode Problem Detector - Sends info to side panel
// No floating panel - everything in side panel

function detectProblem() {
    const problemTitle = document.querySelector('[data-cy="question-title"]')?.textContent;
    const problemSlug = window.location.pathname.split('/problems/')[1]?.split('/')[0];
    
    if (problemTitle && problemSlug) {
        // Send to side panel
        chrome.runtime.sendMessage({
            action: 'problem_detected',
            data: {
                title: problemTitle,
                slug: problemSlug,
                url: window.location.href
            }
        });
    }
}

// Initialize
if (window.location.pathname.includes('/problems/')) {
    setTimeout(detectProblem, 2000);
    
    // Re-detect on navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.pathname.includes('/problems/')) {
                setTimeout(detectProblem, 1000);
            }
        }
    }).observe(document, { subtree: true, childList: true });
}

