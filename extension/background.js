// LeetBuddy Background Service Worker

// GitHub OAuth
const GITHUB_CLIENT_ID = 'Ov23litQ9Nqwxi1jEg2h';
const GITHUB_REDIRECT_URI = chrome.identity.getRedirectURL('github');
const API_BASE = 'http://localhost:8001';

console.log('🔑 Redirect URI:', GITHUB_REDIRECT_URI);

// Open side panel when icon clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authenticate_github') {
        authenticateGitHub()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    if (message.action === 'sync_solution') {
        syncToGitHub(message.data)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

// GitHub Authentication
async function authenticateGitHub() {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`;
    
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            { url: authUrl, interactive: true },
            async (redirectUrl) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                
                const url = new URL(redirectUrl);
                const code = url.searchParams.get('code');
                
                if (!code) {
                    reject(new Error('No code received'));
                    return;
                }
                
                try {
                    // Exchange code for token
                    const response = await fetch(`${API_BASE}/api/github/exchange-token?code=${code}`);
                    const data = await response.json();
                    
                    if (data.access_token) {
                        // Get user info
                        const userResponse = await fetch('https://api.github.com/user', {
                            headers: { 'Authorization': `Bearer ${data.access_token}` }
                        });
                        const userData = await userResponse.json();
                        
                        // Save to storage
                        await chrome.storage.local.set({
                            github_token: data.access_token,
                            github_user: userData.login,
                            github_repo: 'leetbuddy-solutions'
                        });
                        
                        // Create repo if doesn't exist
                        await ensureRepo(data.access_token, 'leetbuddy-solutions');
                        
                        resolve();
                    } else {
                        reject(new Error('Failed to get token'));
                    }
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

// Ensure repo exists
async function ensureRepo(token, repoName) {
    try {
        const checkResponse = await fetch(`https://api.github.com/repos/${await getUsername(token)}/${repoName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (checkResponse.status === 404) {
            // Create repo
            await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: 'LeetCode solutions synced by LeetBuddy',
                    private: false,
                    auto_init: true
                })
            });
        }
    } catch (error) {
        console.error('Error ensuring repo:', error);
    }
}

async function getUsername(token) {
    const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.login;
}

// Sync to GitHub
async function syncToGitHub(solutionData) {
    const { github_token, github_user, github_repo } = await chrome.storage.local.get([
        'github_token', 'github_user', 'github_repo'
    ]);
    
    if (!github_token) {
        throw new Error('GitHub not connected');
    }
    
    const { problemId, title, titleSlug, difficulty, code, language, notes, topics } = solutionData;
    
    // Determine file extension
    const extensions = {
        'python3': 'py', 'python': 'py',
        'javascript': 'js', 'typescript': 'ts',
        'java': 'java', 'cpp': 'cpp', 'c': 'c',
        'csharp': 'cs', 'go': 'go', 'rust': 'rs',
        'swift': 'swift', 'kotlin': 'kt', 'ruby': 'rb'
    };
    const ext = extensions[language.toLowerCase()] || 'txt';
    
    // Get primary topic
    const primaryTopic = topics && topics.length > 0 ? topics[0] : 'General';
    
    // Create folder path
    const folder = `By-Topic/${primaryTopic}/${difficulty}/${problemId}-${titleSlug}`;
    
    // Upload solution file
    await uploadFile(github_token, github_user, github_repo, 
        `${folder}/solution.${ext}`, code);
    
    // Upload notes if exists
    if (notes && notes.trim()) {
        await uploadFile(github_token, github_user, github_repo, 
            `${folder}/notes.md`, notes);
    }
    
    // Upload problem info
    const problemInfo = {
        id: problemId,
        title: title,
        difficulty: difficulty,
        url: `https://leetcode.com/problems/${titleSlug}/`,
        topics: topics,
        solved_at: new Date().toISOString()
    };
    await uploadFile(github_token, github_user, github_repo, 
        `${folder}/problem.json`, JSON.stringify(problemInfo, null, 2));
    
    return { url: `https://github.com/${github_user}/${github_repo}/tree/main/${folder}` };
}

async function uploadFile(token, owner, repo, path, content) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Add ${path}`,
            content: btoa(unescape(encodeURIComponent(content)))
        })
    });
    
    return await response.json();
}
