// LeetBuddy Background Service Worker

// GitHub OAuth
const GITHUB_CLIENT_ID = 'Ov23liLrSlC0TQMHJWOw';
const GITHUB_REDIRECT_URI = chrome.identity.getRedirectURL('github');

// Get API URL from storage or default
async function getApiUrl() {
    const { apiUrl } = await chrome.storage.local.get(['apiUrl']);
    return apiUrl || 'http://localhost:8001';
}

console.log('🔑 Redirect URI:', GITHUB_REDIRECT_URI);
console.log('⚠️ Add this URL to GitHub OAuth app settings:');
console.log('   https://github.com/settings/developers');

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
    
    // Forward problem detection to side panel
    if (message.action === 'problem_detected') {
        // Message will be received by panel via chrome.runtime.onMessage
        return false;
    }
});

// GitHub Authentication
async function authenticateGitHub() {
    console.log('🔵 Starting GitHub authentication...');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}`;
    console.log('🔵 Auth URL:', authUrl);
    
    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
            { url: authUrl, interactive: true },
            async (redirectUrl) => {
                console.log('🔵 Got redirect URL:', redirectUrl);
                
                if (chrome.runtime.lastError) {
                    console.error('❌ Auth error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }
                
                if (!redirectUrl) {
                    reject(new Error('No redirect URL'));
                    return;
                }
                
                const url = new URL(redirectUrl);
                const code = url.searchParams.get('code');
                console.log('🔵 Extracted code:', code ? 'YES' : 'NO');
                
                if (!code) {
                    console.error('❌ No code in redirect URL');
                    reject(new Error('No code received'));
                    return;
                }
                
                try {
                    const API_BASE = await getApiUrl();
                    console.log('🔵 API Base:', API_BASE);
                    console.log('🔵 Exchanging code for token...');
                    
                    // Exchange code for token
                    const response = await fetch(`${API_BASE}/api/github/exchange-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            code: code,
                            redirect_uri: GITHUB_REDIRECT_URI 
                        })
                    });
                    
                    const data = await response.json();
                    console.log('🔵 Exchange response:', data.access_token ? 'Got token' : 'No token');
                    
                    if (data.access_token) {
                        console.log('✅ Access token received');
                        // Get user info
                        const userResponse = await fetch('https://api.github.com/user', {
                            headers: { 'Authorization': `Bearer ${data.access_token}` }
                        });
                        const userData = await userResponse.json();
                        console.log('✅ User data:', userData.login);
                        
                        // Save to storage
                        await chrome.storage.local.set({
                            github_token: data.access_token,
                            github_user: userData.login,
                            github_repo: 'leetbuddy-solutions'
                        });
                        console.log('✅ Saved to storage');
                        
                        // Create repo if doesn't exist
                        console.log('🔵 Ensuring repo exists...');
                        await ensureRepo(data.access_token, 'leetbuddy-solutions');
                        
                        resolve();
                    } else {
                        reject(new Error(data.error || 'Failed to get token'));
                    }
                } catch (error) {
                    console.error('Token exchange error:', error);
                    reject(error);
                }
            }
        );
    });
}

// Ensure repo exists
async function ensureRepo(token, repoName) {
    try {
        const username = await getUsername(token);
        console.log('🔵 Checking repo for user:', username);
        
        const checkResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (checkResponse.status === 404) {
            console.log('🔵 Repo not found, creating...');
            // Create repo
            const createResponse = await fetch('https://api.github.com/user/repos', {
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
            
            if (createResponse.ok) {
                console.log('✅ Repo created successfully');
            } else {
                const errorData = await createResponse.json();
                console.error('❌ Failed to create repo:', errorData);
            }
        } else if (checkResponse.ok) {
            console.log('✅ Repo already exists');
        } else {
            console.error('❌ Unexpected response when checking repo:', checkResponse.status);
        }
    } catch (error) {
        console.error('❌ Error ensuring repo:', error);
        // Don't throw - allow authentication to complete even if repo creation fails
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
