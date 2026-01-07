// LeetCode Submission Detector

// Get API URL from storage
async function getApiUrl() {
    const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
    return apiUrl || 'http://localhost:8001';
}

// Detect successful submission
let lastSubmission = null;

// Listen for GraphQL responses
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (args[0].includes('graphql')) {
        const clone = response.clone();
        const data = await clone.json();
        
        if (data.data?.submitCode?.status_msg === 'Accepted') {
            handleSuccessfulSubmission(data.data.submitCode);
        }
    }
    
    return response;
};

async function handleSuccessfulSubmission(submissionData) {
    console.log('✓ Successful submission detected!');
    
    // Get problem info
    const problemTitle = document.querySelector('[data-cy="question-title"]')?.textContent;
    const problemId = window.location.pathname.split('/')[2];
    
    if (!problemTitle) return;
    
    // Get code
    const codeEditor = document.querySelector('.monaco-editor');
    const code = codeEditor ? getEditorContent() : '';
    
    // Get language
    const langButton = document.querySelector('[id^="headlessui-listbox-button"]');
    const language = langButton?.textContent?.trim() || 'Unknown';
    
    // Get notes
    const notesPanel = document.getElementById('leetbuddy-notes');
    const notes = notesPanel?.value || '';
    
    // Get GitHub user for user_id
    const { github_user, autoSync } = await chrome.storage.local.get(['github_user', 'autoSync']);
    
    const solutionData = {
        user_id: github_user || 'anonymous',
        problem_id: parseInt(problemId),
        title: problemTitle,
        titleSlug: window.location.pathname.split('/')[2],
        difficulty: getDifficulty(),
        code: code,
        language: language,
        runtime: submissionData.status_runtime || null,
        memory: submissionData.status_memory || null,
        notes: notes,
        topics: getTopics()
    };
    
    // Save to database
    try {
        const API_BASE = await getApiUrl();
        
        const response = await fetch(`${API_BASE}/api/progress/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(solutionData)
        });
        
        const result = await response.json();
        console.log('✓ Saved to database:', result);
        
        showNotification('✓ Solution saved to database!');
        
        // Sync to GitHub if enabled
        if (autoSync) {
            chrome.runtime.sendMessage(
                { action: 'sync_solution', data: solutionData },
                (response) => {
                    if (response && response.success) {
                        showNotification('✓ Synced to GitHub!');
                        
                        // Update database with GitHub sync status
                        fetch(`${API_BASE}/api/progress/${result.progress_id}/github-sync`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                github_url: response.result.url
                            })
                        });
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error saving solution:', error);
        showNotification('✗ Failed to save solution');
    }
}

function getEditorContent() {
    const monaco = window.monaco;
    if (monaco && monaco.editor) {
        const editors = monaco.editor.getEditors();
        if (editors.length > 0) {
            return editors[0].getValue();
        }
    }
    return '';
}

function getDifficulty() {
    const diffElement = document.querySelector('[diff]');
    return diffElement?.getAttribute('diff') || 'Unknown';
}

function getTopics() {
    const topicElements = document.querySelectorAll('[data-cy="tag-item"]');
    return Array.from(topicElements).map(el => el.textContent.trim());
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 999999;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Detect current problem and notify side panel
function detectAndNotifyProblem() {
    const problemTitle = document.querySelector('[data-cy="question-title"]')?.textContent;
    const problemSlug = window.location.pathname.split('/problems/')[1]?.split('/')[0];
    
    if (problemTitle && problemSlug) {
        // Extract problem ID from page
        const problemId = extractProblemId();
        
        // Send to side panel
        chrome.runtime.sendMessage({
            action: 'problem_detected',
            data: {
                title: problemTitle,
                slug: problemSlug,
                url: window.location.href,
                problem_id: problemId,
                difficulty: getDifficulty(),
                topics: getTopics()
            }
        });
    }
}

function extractProblemId() {
    // Try to get from URL or page data
    const urlMatch = window.location.pathname.match(/\/problems\/([^\/]+)/);
    if (urlMatch) {
        // Check page for problem number
        const titleElement = document.querySelector('[data-cy="question-title"]');
        if (titleElement) {
            const fullText = titleElement.textContent;
            const match = fullText.match(/^(\d+)\./);
            if (match) {
                return parseInt(match[1]);
            }
        }
    }
    return null;
}

// Initialize problem detection
if (window.location.pathname.includes('/problems/')) {
    // Wait for page to load
    setTimeout(detectAndNotifyProblem, 2000);
    
    // Re-detect on navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.pathname.includes('/problems/')) {
                setTimeout(detectAndNotifyProblem, 1000);
            }
        }
    }).observe(document, { subtree: true, childList: true });
}

