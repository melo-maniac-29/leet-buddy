// LeetCode submission detector
// Monitors LeetCode for successful submissions

console.log('🚀 LeetBuddy: Detector loaded');

// Check if we're on a problem page
const isProblemPage = window.location.pathname.startsWith('/problems/');

if (isProblemPage) {
    initializeDetector();
}

function initializeDetector() {
    // Extract problem information
    const problemSlug = window.location.pathname.split('/')[2];
    let problemData = null;
    
    console.log('📝 Problem detected:', problemSlug);
    
    // Wait for page to load
    setTimeout(() => {
        extractProblemData();
        monitorSubmissions();
    }, 2000);
}

// Extract problem data from page
function extractProblemData() {
    try {
        // Try to get problem data from the page
        const titleElement = document.querySelector('[data-cy="question-title"]') || 
                           document.querySelector('.text-title-large');
        
        if (titleElement) {
            const title = titleElement.textContent.trim();
            const match = title.match(/^(\d+)\.\s*(.+)$/);
            
            if (match) {
                problemData = {
                    problemId: parseInt(match[1]),
                    problemTitle: match[2],
                    titleSlug: window.location.pathname.split('/')[2]
                };
                
                // Get difficulty
                const difficultyElement = document.querySelector('[diff]') || 
                                        document.querySelector('.text-difficulty-easy, .text-difficulty-medium, .text-difficulty-hard');
                if (difficultyElement) {
                    problemData.difficulty = difficultyElement.textContent.trim();
                }
                
                // Get topics
                const topicElements = document.querySelectorAll('a[href^="/tag/"]');
                problemData.topics = Array.from(topicElements).map(el => el.textContent.trim());
                
                console.log('✅ Problem data extracted:', problemData);
            }
        }
    } catch (error) {
        console.error('Failed to extract problem data:', error);
    }
}

// Monitor for submission results
function monitorSubmissions() {
    // Watch for success message
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Check for success indicators
            const successElements = document.querySelectorAll('[data-e2e-locator="submission-result"]');
            
            for (const element of successElements) {
                const text = element.textContent.toLowerCase();
                
                if (text.includes('accepted') || text.includes('success')) {
                    console.log('🎉 Submission accepted!');
                    handleSuccessfulSubmission();
                    break;
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👀 Monitoring submissions...');
}

// Handle successful submission
async function handleSuccessfulSubmission() {
    try {
        // Extract submission details
        const submissionData = await extractSubmissionData();
        
        if (!submissionData) {
            console.error('Failed to extract submission data');
            return;
        }
        
        console.log('📊 Submission data:', submissionData);
        
        // Get user and settings
        const { github_user, settings } = await chrome.storage.local.get(['github_user', 'settings']);
        const userId = github_user?.login || 'guest';
        
        // 1. Save to database first
        try {
            const saveResponse = await fetch('http://localhost:8001/api/progress/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    problem_id: submissionData.problemId,
                    language: submissionData.language,
                    solution_code: submissionData.code,
                    runtime: submissionData.runtime,
                    memory: submissionData.memory,
                    notes: submissionData.notes || '',
                    github_synced: false
                })
            });
            
            if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                console.log('✅ Progress saved to database:', saveData);
                showNotification('Solution saved to database!', 'success');
                
                // 2. Auto-sync to GitHub if enabled
                if (settings?.autoSync) {
                    await syncSolution(submissionData, saveData.progress_id);
                }
            } else {
                console.error('Failed to save progress:', await saveResponse.text());
                showNotification('Failed to save to database', 'error');
            }
        } catch (error) {
            console.error('Error saving to database:', error);
            showNotification('Database error: ' + error.message, 'error');
        }
        
        // 3. Show contribution prompt if solution is new
        const { settings: contributionSettings } = await chrome.storage.local.get(['settings']);
        showContributionPrompt(submissionData, contributionSettings);
        
    } catch (error) {
        console.error('Error handling submission:', error);
    }
}

// Extract submission data from page
async function extractSubmissionData() {
    try {
        // Get code from editor
        const codeElement = document.querySelector('.monaco-editor') || 
                          document.querySelector('[data-mode-id]');
        
        let code = '';
        if (codeElement) {
            // Try to get code from Monaco editor
            const model = window.monaco?.editor?.getModels()[0];
            code = model ? model.getValue() : '';
        }
        
        if (!code) {
            // Fallback: try to get from textarea
            const textarea = document.querySelector('textarea');
            code = textarea ? textarea.value : '';
        }
        
        // Get language
        const languageButton = document.querySelector('[id^="headlessui-listbox-button"]');
        const language = languageButton ? languageButton.textContent.trim() : 'Unknown';
        
        // Get runtime and memory
        let runtime = null;
        let memory = null;
        
        const runtimeElement = document.querySelector('[class*="runtime"]');
        const memoryElement = document.querySelector('[class*="memory"]');
        
        if (runtimeElement) {
            runtime = runtimeElement.textContent.trim();
        }
        if (memoryElement) {
            memory = memoryElement.textContent.trim();
        }
        
        // Get notes from our panel
        const notesTextarea = document.getElementById('leetbuddy-notes');
        const notes = notesTextarea ? notesTextarea.value : '';
        
        return {
            ...problemData,
            language,
            code,
            notes,
            runtime,
            memory
        };
        
    } catch (error) {
        console.error('Failed to extract submission data:', error);
        return null;
    }
}

// Show contribution prompt
function showContributionPrompt(data, settings) {
    // Check if solution already exists in database
    checkSolutionExists(data.problemId, data.language).then(exists => {
        if (!exists && settings?.autoContribute) {
            // Show modal to contribute
            const modal = createContributionModal(data);
            document.body.appendChild(modal);
        }
    });
}

// Check if solution exists
async function checkSolutionExists(problemId, language) {
    try {
        const response = await fetch(`http://localhost:8000/api/solutions/${problemId}`);
        const solutions = await response.json();
        return solutions.some(s => s.language === language);
    } catch (error) {
        console.error('Failed to check solution:', error);
        return true; // Assume exists on error
    }
}

// Create contribution modal
function createContributionModal(data) {
    const modal = document.createElement('div');
    modal.id = 'leetbuddy-modal';
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 24px;
                border-radius: 12px;
                max-width: 500px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            ">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #333;">
                    🎉 New Solution!
                </h2>
                <p style="color: #666; margin-bottom: 20px;">
                    We don't have a <strong>${data.language}</strong> solution for this problem yet.
                    Would you like to contribute to the open source community?
                </p>
                <div style="display: flex; gap: 12px;">
                    <button id="leetbuddy-contribute" style="
                        flex: 1;
                        padding: 12px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        ✨ Contribute
                    </button>
                    <button id="leetbuddy-skip" style="
                        flex: 1;
                        padding: 12px;
                        background: #f5f5f5;
                        color: #666;
                        border: none;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        Skip
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    modal.querySelector('#leetbuddy-contribute').addEventListener('click', async () => {
        await contributeSolution(data);
        modal.remove();
    });
    
    modal.querySelector('#leetbuddy-skip').addEventListener('click', () => {
        modal.remove();
    });
    
    return modal;
}

// Sync solution to GitHub
async function syncSolution(data, progressId) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'sync_solution',
            data: data
        });
        
        if (response.success) {
            console.log('✅ Synced to GitHub:', response.result);
            showNotification('Synced to GitHub!', 'success');
            
            // Update GitHub sync status in database
            if (progressId && response.result?.path) {
                try {
                    await fetch(`http://localhost:8001/api/progress/${progressId}/github-sync`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            github_url: response.result.path
                        })
                    });
                    console.log('✅ GitHub sync status updated in database');
                } catch (err) {
                    console.error('Failed to update GitHub sync status:', err);
                }
            }
        } else {
            console.error('Sync failed:', response.error);
            showNotification('Sync failed: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Contribute solution
async function contributeSolution(data) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'contribute_solution',
            data: data
        });
        
        if (response.success) {
            console.log('✅ Contributed:', response.result);
            showNotification('🎉 Thanks for contributing!', 'success');
            
            if (response.result.pr_url) {
                // Show PR link
                setTimeout(() => {
                    if (confirm('View your pull request on GitHub?')) {
                        window.open(response.result.pr_url, '_blank');
                    }
                }, 1000);
            }
        } else {
            console.error('Contribution failed:', response.error);
            showNotification('Contribution failed: ' + response.error, 'error');
        }
    } catch (error) {
        console.error('Contribution error:', error);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
