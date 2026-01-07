// Background service worker for LeetBuddy extension

// GitHub OAuth configuration (ONLY Client ID - Secret stays on GitHub!)
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // Get from https://github.com/settings/developers
const GITHUB_REDIRECT_URI = chrome.identity.getRedirectURL('github');

// API endpoints
const LEETBUDDY_API = 'http://localhost:8000';
const GITHUB_API = 'https://api.github.com';

// Main LeetBuddy repository (for contributions)
const MAIN_REPO_OWNER = 'melo-maniac-29';
const MAIN_REPO_NAME = 'leet-buddy';

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.action) {
        case 'authenticate_github':
            authenticateGitHub()
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep channel open for async response
            
        case 'sync_solution':
            syncSolutionToGitHub(message.data)
                .then(result => sendResponse({ success: true, result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'contribute_solution':
            contributeSolution(message.data)
                .then(result => sendResponse({ success: true, result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'select_repository':
            selectRepository()
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'settings_updated':
            handleSettingsUpdate(message.settings);
            sendResponse({ success: true });
            break;
    }
});

// GitHub OAuth authentication (Secure - no client secret exposed!)
async function authenticateGitHub() {
    try {
        // Step 1: Get authorization code from GitHub
        const authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${GITHUB_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&` +
            `scope=repo,user`;
        
        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        });
        
        // Extract code from redirect URL
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');
        
        if (!code) {
            throw new Error('No authorization code received');
        }
        
        // Step 2: Exchange code via backend (keeps secret secure!)
        const tokenResponse = await fetch(`${LEETBUDDY_API}/api/github/exchange-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange authorization code');
        }
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Step 3: Get user info
        const userResponse = await fetch(`${GITHUB_API}/user`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const userData = await userResponse.json();
        
        // Store credentials
        await chrome.storage.local.set({
            github_token: accessToken,
            github_user: userData
        });
        
        console.log('GitHub authentication successful');
        return userData;
        
    } catch (error) {
        console.error('GitHub authentication failed:', error);
        throw error;
    }
}

// Select repository for syncing
async function selectRepository() {
    try {
        const { github_token } = await chrome.storage.local.get(['github_token']);
        
        if (!github_token) {
            throw new Error('Not authenticated with GitHub');
        }
        
        // Get user's repositories
        const response = await fetch(`${GITHUB_API}/user/repos?type=owner&sort=updated`, {
            headers: {
                'Authorization': `token ${github_token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const repos = await response.json();
        
        // For now, create or use 'leetcode-solutions' repo
        const repoName = 'leetcode-solutions';
        let selectedRepo = repos.find(r => r.name === repoName);
        
        if (!selectedRepo) {
            // Create new repository
            const createResponse = await fetch(`${GITHUB_API}/user/repos`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: 'My LeetCode solutions - Auto-synced with LeetBuddy',
                    private: false,
                    auto_init: true
                })
            });
            
            selectedRepo = await createResponse.json();
        }
        
        // Store selected repository
        await chrome.storage.local.set({
            github_repo: selectedRepo.full_name
        });
        
        console.log('Repository selected:', selectedRepo.full_name);
        return selectedRepo;
        
    } catch (error) {
        console.error('Failed to select repository:', error);
        throw error;
    }
}

// Sync solution to GitHub
async function syncSolutionToGitHub(data) {
    try {
        const { github_token, github_repo, settings } = await chrome.storage.local.get([
            'github_token', 
            'github_repo', 
            'settings'
        ]);
        
        if (!github_token || !github_repo) {
            throw new Error('GitHub not configured');
        }
        
        const {
            problemId,
            problemTitle,
            titleSlug,
            difficulty,
            topics,
            language,
            code,
            notes,
            runtime,
            memory
        } = data;
        
        // Determine folder structure
        const primaryTopic = topics && topics.length > 0 ? topics[0].replace(/\s+/g, '-') : 'Other';
        const folderPath = settings?.organizeByTopic 
            ? `By-Topic/${primaryTopic}/${difficulty}/${problemId}-${titleSlug}`
            : `By-Difficulty/${difficulty}/${problemId}-${titleSlug}`;
        
        // Get file extension
        const languageExtensions = {
            'Python': '.py', 'Python3': '.py',
            'JavaScript': '.js', 'TypeScript': '.ts',
            'Java': '.java', 'C++': '.cpp', 'C': '.c',
            'Go': '.go', 'Rust': '.rs', 'Ruby': '.rb',
            'Swift': '.swift', 'Kotlin': '.kt', 'C#': '.cs'
        };
        const ext = languageExtensions[language] || '.txt';
        
        // Create files to upload
        const files = [];
        
        // 1. Solution file
        files.push({
            path: `${folderPath}/solution${ext}`,
            content: code
        });
        
        // 2. Problem metadata
        const problemJson = {
            problem_id: problemId,
            title: problemTitle,
            difficulty: difficulty,
            topics: topics || [],
            url: `https://leetcode.com/problems/${titleSlug}/`,
            solved_at: new Date().toISOString(),
            runtime: runtime,
            memory: memory
        };
        
        files.push({
            path: `${folderPath}/problem.json`,
            content: JSON.stringify(problemJson, null, 2)
        });
        
        // 3. Notes (if enabled and available)
        if (settings?.includeNotes && notes) {
            files.push({
                path: `${folderPath}/notes.md`,
                content: notes
            });
        }
        
        // Upload files to GitHub
        for (const file of files) {
            await uploadFileToGitHub(github_token, github_repo, file.path, file.content);
        }
        
        // Update stats
        await updateStats('synced');
        
        console.log('Solution synced to GitHub:', folderPath);
        return { success: true, path: folderPath };
        
    } catch (error) {
        console.error('Failed to sync to GitHub:', error);
        throw error;
    }
}

// Upload file to GitHub
async function uploadFileToGitHub(token, repo, path, content) {
    try {
        // Check if file exists
        const checkResponse = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let sha = null;
        if (checkResponse.ok) {
            const data = await checkResponse.json();
            sha = data.sha;
        }
        
        // Upload file
        const uploadResponse = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add ${path}`,
                content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
                sha: sha // Include SHA if updating
            })
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${path}`);
        }
        
        return await uploadResponse.json();
        
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}

// Contribute solution to LeetBuddy database
// Users create PR directly with their own GitHub token (secure for open source)
async function contributeSolution(data) {
    try {
        const { github_token, github_user } = await chrome.storage.local.get(['github_token', 'github_user']);
        
        if (!github_token) {
            throw new Error('Please connect your GitHub account first');
        }
        
        const contributor = github_user?.login || 'anonymous';
        const timestamp = Date.now();
        const branchName = `contrib-${data.language.toLowerCase()}-${data.problemId}-${timestamp}`;
        
        // 1. Get main branch SHA
        const branchResponse = await fetch(
            `${GITHUB_API}/repos/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}/git/refs/heads/main`,
            {
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        const branchData = await branchResponse.json();
        const mainSha = branchData.object.sha;
        
        // 2. Create new branch
        await fetch(
            `${GITHUB_API}/repos/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}/git/refs`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: `refs/heads/${branchName}`,
                    sha: mainSha
                })
            }
        );
        
        // 3. Get current final_database.json
        const dbResponse = await fetch(
            `${GITHUB_API}/repos/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}/contents/processed-data/final_database.json?ref=${branchName}`,
            {
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        const dbData = await dbResponse.json();
        
        // Decode database
        const currentDb = JSON.parse(atob(dbData.content));
        
        // 4. Add new solution
        const problem = currentDb.problems.find(p => p.problem_id === data.problemId);
        if (!problem) {
            throw new Error(`Problem #${data.problemId} not found`);
        }
        
        if (!problem.solutions) problem.solutions = {};
        if (!problem.solutions[data.language.toLowerCase()]) {
            problem.solutions[data.language.toLowerCase()] = [];
        }
        
        problem.solutions[data.language.toLowerCase()].push({
            code: data.code,
            source: 'community',
            language: data.language,
            contributor: contributor,
            contributed_at: new Date().toISOString(),
            runtime: data.runtime,
            memory: data.memory
        });
        
        currentDb.metadata.last_updated = new Date().toISOString().split('T')[0];
        
        // 5. Commit to branch
        const updatedContent = JSON.stringify(currentDb, null, 2);
        await fetch(
            `${GITHUB_API}/repos/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}/contents/processed-data/final_database.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Add ${data.language} solution for Problem #${data.problemId}: ${data.problemTitle}\n\nContributed by @${contributor}`,
                    content: btoa(unescape(encodeURIComponent(updatedContent))),
                    branch: branchName,
                    sha: dbData.sha
                })
            }
        );
        
        // 6. Create pull request
        const prResponse = await fetch(
            `${GITHUB_API}/repos/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}/pulls`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: `Add ${data.language} solution for Problem #${data.problemId}: ${data.problemTitle}`,
                    head: branchName,
                    base: 'main',
                    body: `## 🎉 New Solution Contribution\n\n` +
                          `**Problem:** [#${data.problemId}: ${data.problemTitle}](https://leetcode.com/problems/${data.problemTitle.toLowerCase().replace(/\\s+/g, '-')}/)\n` +
                          `**Language:** ${data.language}\n` +
                          `**Contributor:** @${contributor}\n\n` +
                          `### Performance Metrics\n` +
                          (data.runtime ? `- **Runtime:** ${data.runtime}\n` : '') +
                          (data.memory ? `- **Memory:** ${data.memory}\n` : '') +
                          `\n### Contribution Details\n` +
                          `- ✅ Solution verified on LeetCode\n` +
                          `- ✅ Created via LeetBuddy extension\n` +
                          `- ✅ Ready for review\n\n` +
                          `---\n*Auto-generated by [LeetBuddy](https://github.com/${MAIN_REPO_OWNER}/${MAIN_REPO_NAME}) 🚀*`
                })
            }
        );
        
        const prData = await prResponse.json();
        
        await updateStats('contributed');
        
        return {
            status: 'success',
            pr_number: prData.number,
            pr_url: prData.html_url,
            message: 'Pull request created successfully!'
        };
        
    } catch (error) {
        console.error('Failed to contribute:', error);
        throw error;
    }
}

// Update statistics
async function updateStats(type) {
    const { stats } = await chrome.storage.local.get(['stats']);
    const currentStats = stats || { solved: 0, synced: 0, contributed: 0 };
    
    if (type === 'solved') currentStats.solved++;
    if (type === 'synced') currentStats.synced++;
    if (type === 'contributed') currentStats.contributed++;
    
    await chrome.storage.local.set({ stats: currentStats });
    
    // Notify popup
    chrome.runtime.sendMessage({
        action: 'update_stats',
        stats: currentStats
    });
}

// Handle settings update
function handleSettingsUpdate(settings) {
    console.log('Settings updated:', settings);
}

console.log('LeetBuddy background service worker loaded');
