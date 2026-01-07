// LeetBuddy Side Panel App
let currentView = 'home';
let allTopics = [];
let githubConnected = false;
let API_URL = 'http://localhost:8001'; // Default

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    checkGitHub();
    loadRoadmaps();
    
    // Event listeners
    document.getElementById('githubBtn').addEventListener('click', connectGitHub);
    document.getElementById('settingsBtn').addEventListener('click', () => showView('settings'));
    document.getElementById('backBtn').addEventListener('click', () => showView('home'));
    document.getElementById('backTopics').addEventListener('click', () => showView('home'));
    document.getElementById('backProblem').addEventListener('click', () => showView('home'));
    document.getElementById('backSettings').addEventListener('click', () => showView('home'));
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('testConnection').addEventListener('click', testConnection);
    
    // Problem view tabs
    document.querySelectorAll('.prob-tab').forEach(tab => {
        tab.addEventListener('click', () => switchProblemTab(tab.dataset.tab));
    });
    
    // Chat functionality
    document.getElementById('chatSend')?.addEventListener('click', sendAIMessage);
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('chatInput').value = btn.dataset.prompt;
            sendAIMessage();
        });
    });
    
    // Listen for problem detection from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'problem_detected') {
            loadProblemView(request.data);
        }
    });
});

async function loadSettings() {
    const settings = await chrome.storage.local.get(['apiUrl', 'autoSync', 'github_user']);
    
    if (settings.apiUrl) {
        API_URL = settings.apiUrl;
        document.getElementById('apiUrl').value = settings.apiUrl;
    }
    if (settings.autoSync !== undefined) {
        document.getElementById('autoSync').checked = settings.autoSync;
    }
    
    // Load available providers and their default URLs
    try {
        const providersRes = await fetch(`${API_URL}/api/ai-settings/providers`);
        if (providersRes.ok) {
            const data = await providersRes.json();
            displayProviderDefaults(data.providers);  // Backend returns { providers: [...] }
        }
    } catch (error) {
        console.error('Error loading providers:', error);
    }
    
    // Load AI settings from backend if user connected
    if (settings.github_user) {
        try {
            const response = await fetch(`${API_URL}/api/ai-settings/${settings.github_user}`);
            if (response.ok) {
                const aiSettings = await response.json();
                document.getElementById('aiProvider').value = aiSettings.provider || '';
                document.getElementById('aiBaseUrl').value = aiSettings.api_base_url || '';
                document.getElementById('aiModel').value = aiSettings.model_name || 'gpt-3.5-turbo';
                // Backend returns has_api_key boolean, not the actual key (security)
                // Leave API key field empty for security
            }
        } catch (error) {
            console.error('Error loading AI settings:', error);
        }
    }
}

function displayProviderDefaults(providers) {
    const container = document.getElementById('providerDefaults');
    if (!container) return;
    
    container.innerHTML = '<h4>AI Provider Default URLs:</h4>';
    providers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'provider-default';
        div.innerHTML = `
            <strong>${p.name}</strong><br>
            <input type="text" value="${p.base_url}" data-provider="${p.id}" class="provider-url-input" style="width:100%;margin:5px 0;">
        `;
        container.appendChild(div);
    });
}

async function saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const autoSync = document.getElementById('autoSync').checked;
    const aiProvider = document.getElementById('aiProvider').value;
    const aiBaseUrl = document.getElementById('aiBaseUrl').value.trim();
    const aiApiKey = document.getElementById('aiApiKey').value.trim();
    const aiModel = document.getElementById('aiModel').value;
    
    // Save backend settings locally
    await chrome.storage.local.set({ apiUrl, autoSync });
    API_URL = apiUrl;
    
    // Get custom provider URLs from inputs
    const customUrls = {};
    document.querySelectorAll('.provider-url-input').forEach(input => {
        customUrls[input.dataset.provider] = input.value.trim();
    });
    
    const { github_user } = await chrome.storage.local.get(['github_user']);
    if (github_user && aiProvider) {
        try {
            // Backend expects: { provider, api_base_url, model_name, enabled } + api_key as query param
            const finalBaseUrl = aiBaseUrl || customUrls[aiProvider] || getDefaultBaseUrl(aiProvider);
            
            // Build URL with api_key as query parameter
            const url = `${API_URL}/api/ai-settings/${github_user}/configure${aiApiKey ? '?api_key=' + encodeURIComponent(aiApiKey) : ''}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: aiProvider,
                    api_base_url: finalBaseUrl,
                    model_name: aiModel,
                    enabled: true
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Failed to save AI settings:', error);
                alert('Failed to save AI settings: ' + (error.detail || 'Unknown error'));
                return;
            }
            
            console.log('✅ AI settings saved successfully');
        } catch (error) {
            console.error('❌ Error saving AI settings:', error);
            alert('Error saving AI settings: ' + error.message);
            return;
        }
    }
    
    alert('✓ All settings saved!');
    showView('home');
}

function getDefaultBaseUrl(provider) {
    const defaults = {
        'openai': 'https://api.openai.com/v1',
        'anthropic': 'https://api.anthropic.com/v1'
    };
    return defaults[provider] || '';
}

async function testConnection() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const btn = document.getElementById('testConnection');
    
    btn.textContent = 'Testing...';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${apiUrl}/api/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            alert('✓ Connection successful!\n\n' + data.message);
        } else {
            alert('⚠️ Backend responded but not healthy');
        }
    } catch (error) {
        alert('✗ Connection failed!\n\nMake sure backend is running:\n1. cd to project folder\n2. Run: docker-compose up -d\n\nError: ' + error.message);
    } finally {
        btn.textContent = 'Test Connection';
        btn.disabled = false;
    }
}

// View Management
function showView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    const views = {
        'home': 'homeView',
        'detail': 'detailView',
        'topics': 'topicsView',
        'problem': 'problemView',
        'settings': 'settingsView'
    };
    
    if (views[view]) {
        document.getElementById(views[view]).classList.add('active');
    }
    
    currentView = view;
}

function switchProblemTab(tabName) {
    document.querySelectorAll('.prob-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prob-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// GitHub Connection
async function checkGitHub() {
    try {
        const { github_token, github_user } = await chrome.storage.local.get(['github_token', 'github_user']);
        
        if (github_token) {
            githubConnected = true;
            document.getElementById('githubIcon').textContent = '✓';
            document.getElementById('githubText').textContent = github_user || 'Connected';
            document.getElementById('githubBtn').classList.add('connected');
        }
    } catch (error) {
        console.error('Error checking GitHub:', error);
    }
}

function connectGitHub() {
    console.log('🔵 Connect GitHub button clicked');
    console.log('📋 Redirect URI: https://mppmkiekkdglndpmgclgoniajmobckbk.chromiumapp.org/github');
    console.log('⚠️ Make sure this URI is added to: https://github.com/settings/developers');
    
    if (!chrome.runtime) {
        console.error('❌ chrome.runtime not available');
        alert('Extension error: Runtime not available');
        return;
    }
    
    chrome.runtime.sendMessage({ action: 'authenticate_github' }, (response) => {
        console.log('🔵 GitHub auth response:', response);
        
        if (chrome.runtime.lastError) {
            console.error('❌ Runtime error:', chrome.runtime.lastError);
            const errorMsg = chrome.runtime.lastError.message;
            
            if (errorMsg.includes('Authorization page could not be loaded')) {
                alert('❌ GitHub OAuth Setup Required!\n\nAdd this redirect URI to your GitHub OAuth app:\nhttps://mppmkiekkdglndpmgclgoniajmobckbk.chromiumapp.org/github\n\n1. Go to: https://github.com/settings/developers\n2. Click your OAuth app (Client ID: Ov23liLrSlC0TQMHJWOw)\n3. Add the redirect URI to "Authorization callback URL"\n4. Save and try again');
            } else {
                alert('Connection error: ' + errorMsg);
            }
            return;
        }
        
        if (response && response.success) {
            console.log('✅ GitHub auth successful');
            setTimeout(checkGitHub, 1000);
        } else {
            console.error('❌ GitHub auth failed:', response?.error);
            alert('GitHub connection failed: ' + (response?.error || 'Unknown error'));
        }
    });
}

// Load Roadmaps
async function loadRoadmaps() {
    const loading = document.getElementById('loadingHome');
    const grid = document.getElementById('roadmapCards');
    
    loading.style.display = 'block';
    grid.innerHTML = '';
    
    try {
        const response = await fetch(`${API_URL}/api/roadmaps/`);
        const roadmaps = await response.json();
        
        console.log('Total roadmaps:', roadmaps.length);
        
        // Separate curated and topics - API returns category field
        const curated = roadmaps.filter(r => r.category === 'curated');
        const topics = roadmaps.filter(r => r.category === 'topic');
        
        console.log('Curated:', curated.length);
        console.log('Topics:', topics.length);
        
        allTopics = topics;
        
        // Define order for curated roadmaps
        const order = ['Fraz', 'Arsh', 'Strivers', 'NeetCode', 'Interview_DS_Algo'];
        
        // Show 5 curated cards in specific order
        order.forEach(name => {
            const roadmap = curated.find(r => r.name === name);
            if (roadmap) {
                const card = createRoadmapCard(roadmap);
                grid.appendChild(card);
            }
        });
        
        // Show 1 Topics card
        if (topics.length > 0) {
            const topicsCard = createTopicsCard(topics);
            grid.appendChild(topicsCard);
        }
        
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading roadmaps:', error);
        loading.innerHTML = '<p style="color: #ef4444;">Failed to load. Is backend running at http://localhost:8001?</p>';
    }
}

function createRoadmapCard(roadmap) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const icons = {
        'Fraz': '📋',
        'Arsh': '🎯',
        'Strivers': '🏆',
        'NeetCode': '💡',
        'Interview_DS_Algo': '🔥'
    };
    
    const descriptions = {
        'Fraz': 'Complete DSA preparation',
        'Arsh': '6-week crash course',
        'Strivers': 'A2Z DSA progression',
        'NeetCode': 'FAANG interview prep',
        'Interview_DS_Algo': 'Interview problem bank'
    };
    
    const name = roadmap.display_name || roadmap.name.replace('_', ' ');
    const desc = roadmap.description || descriptions[roadmap.name] || name;
    
    // Parse difficulty distribution if it's a string
    let diffDist = { Easy: 0, Medium: 0, Hard: 0 };
    if (roadmap.difficulty_distribution) {
        if (typeof roadmap.difficulty_distribution === 'string') {
            diffDist = JSON.parse(roadmap.difficulty_distribution);
        } else {
            diffDist = roadmap.difficulty_distribution;
        }
    }
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">${icons[roadmap.name] || '🗺️'}</span>
            <div class="card-info">
                <div class="card-title">${name}</div>
                <div class="card-desc">${desc}</div>
            </div>
        </div>
        <div class="card-stats">
            <span class="card-stat">📝 ${roadmap.total_problems}</span>
            <span class="diff Easy">${diffDist.Easy || 0}</span>
            <span class="diff Medium">${diffDist.Medium || 0}</span>
            <span class="diff Hard">${diffDist.Hard || 0}</span>
        </div>
    `;
    
    card.addEventListener('click', () => openRoadmap(roadmap));
    
    return card;
}

function createTopicsCard(topics) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const totalProblems = topics.reduce((sum, t) => sum + t.total_problems, 0);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-icon">📚</span>
            <div class="card-info">
                <div class="card-title">Topics by Learning Order</div>
                <div class="card-desc">71 topics in Striver's A2Z progression</div>
            </div>
        </div>
        <div class="card-stats">
            <span class="card-stat">📝 ${totalProblems} problems</span>
            <span class="card-stat">📖 71 paths</span>
        </div>
    `;
    
    card.addEventListener('click', showTopics);
    
    return card;
}

// Open Roadmap
async function openRoadmap(roadmap) {
    showView('detail');
    
    const name = roadmap.display_name || roadmap.name.replace(/^topic_/, '').replace(/_/g, ' ');
    document.getElementById('detailTitle').textContent = name;
    document.getElementById('detailCount').textContent = `${roadmap.total_problems} problems`;
    
    const loading = document.getElementById('loadingDetail');
    const list = document.getElementById('problemsList');
    
    loading.style.display = 'block';
    list.innerHTML = '';
    
    try {
        // Use the roadmap name from API
        const response = await fetch(`${API_URL}/api/roadmaps/${roadmap.name}/problems`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const problems = await response.json();
        
        console.log(`Loaded ${problems.length} problems for ${roadmap.name}`);
        
        if (problems.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">No problems found</p>';
        } else {
            problems.forEach(problem => {
                const item = createProblemItem(problem);
                list.appendChild(item);
            });
        }
        
        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading problems:', error);
        loading.innerHTML = `<p style="color: #ef4444;">Failed to load problems: ${error.message}</p>`;
    }
}

// Show Topics
function showTopics() {
    showView('topics');
    
    const loading = document.getElementById('loadingTopics');
    const grid = document.getElementById('topicsCards');
    
    loading.style.display = 'none';
    grid.innerHTML = '';
    
    // Sort by name since API already returns in learning order
    const sorted = [...allTopics];
    
    sorted.forEach((topic, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const name = topic.display_name.replace(' Mastery', '');
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${index + 1}</span>
                <div class="card-info">
                    <div class="card-title">${name}</div>
                    <div class="card-desc">${topic.total_problems} problems</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openRoadmap(topic));
        
        grid.appendChild(card);
    });
}

// Create Problem Item
function createProblemItem(problem) {
    const item = document.createElement('div');
    item.className = 'problem-item';
    
    item.innerHTML = `
        <div class="problem-title">${problem.id}. ${problem.title}</div>
        <div class="problem-meta">
            <span class="diff ${problem.difficulty}">${problem.difficulty}</span>
            ${problem.acceptance ? `<span>✓ ${problem.acceptance}%</span>` : ''}
            ${problem.topics ? `<span>🏷️ ${problem.topics.slice(0, 2).join(', ')}</span>` : ''}
        </div>
    `;
    
    // Add click handler - either open in LeetCode OR show in panel
    item.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            // Open in new tab
            chrome.tabs.create({ url: `https://leetcode.com/problems/${problem.title_slug}/` });
        } else {
            // Show in panel
            loadProblemView({
                title: problem.title,
                slug: problem.title_slug,
                url: `https://leetcode.com/problems/${problem.title_slug}/`,
                problem_id: problem.problem_id
            });
        }
    });
    
    return item;
}

// Problem View Functions
let currentProblemData = null;

async function loadProblemView(data) {
    currentProblemData = data;
    document.getElementById('problemTitle').textContent = data.title;
    
    // Show basic info
    displayBasicProblemInfo(data);
    
    // Try to load additional data if we have problem_id
    if (data.problem_id) {
        try {
            const response = await fetch(`${API_URL}/api/problems/${data.problem_id}`);
            if (response.ok) {
                const problem = await response.json();
                currentProblemData = { ...currentProblemData, ...problem };
                displayProblemDetails(problem);
            }
        } catch (error) {
            console.error('Error loading problem details:', error);
        }
    }
    
    // Load user's solutions if we have problem_id
    const { github_user } = await chrome.storage.local.get(['github_user']);
    if (github_user && data.problem_id) {
        loadSolutions(github_user, data.problem_id);
    } else if (github_user) {
        document.getElementById('solutionsList').innerHTML = '<p>Loading solutions...</p>';
        // Try to find problem_id by slug
        findProblemIdAndLoadSolutions(github_user, data.slug);
    } else {
        document.getElementById('solutionsList').innerHTML = '<p>Connect GitHub to see your solutions.</p>';
    }
    
    // Load notes
    loadProblemNotes(data.slug);
    
    // Pre-populate AI with problem context
    if (data.difficulty || data.topics) {
        const contextMsg = `I'm working on: ${data.title}${data.difficulty ? ` (${data.difficulty})` : ''}${data.topics?.length ? `\nTopics: ${data.topics.join(', ')}` : ''}`;
        document.getElementById('chatMessages').innerHTML = `
            <div class="chat-message assistant">
                ${contextMsg}
                <br><br>
                How can I help you with this problem?
            </div>
        `;
    }
    
    showView('problem');
}

async function findProblemIdAndLoadSolutions(userId, slug) {
    // Search for problem by slug in the problems list
    try {
        const response = await fetch(`${API_URL}/api/problems?limit=2000`);
        if (response.ok) {
            const problems = await response.json();
            const problem = problems.find(p => p.title_slug === slug);
            if (problem) {
                currentProblemData.problem_id = problem.problem_id;
                loadSolutions(userId, problem.problem_id);
            } else {
                document.getElementById('solutionsList').innerHTML = '<p>Problem not found in database.</p>';
            }
        }
    } catch (error) {
        console.error('Error finding problem:', error);
        document.getElementById('solutionsList').innerHTML = '<p>Error finding problem.</p>';
    }
}

function displayBasicProblemInfo(data) {
    const detailsDiv = document.getElementById('problemDetails');
    detailsDiv.innerHTML = `
        <div class="prob-description">
            <p>Problem: <strong>${data.title}</strong></p>
            <p>View full details on LeetCode</p>
        </div>
    `;
    
    document.getElementById('openLeetCode').onclick = () => {
        chrome.tabs.create({ url: data.url });
    };
}

function displayProblemDetails(problem) {
    const detailsDiv = document.getElementById('problemDetails');
    
    // Get topics as comma-separated string
    const topicsList = problem.topics?.map(t => t.name || t).join(', ') || 'N/A';
    
    detailsDiv.innerHTML = `
        <div class="prob-info">
            <span class="difficulty ${problem.difficulty?.toLowerCase()}">${problem.difficulty}</span>
            <span class="topic-tags">${topicsList}</span>
        </div>
        <div class="prob-stats">
            <div>📊 Acceptance: ${problem.acceptance_rate ? problem.acceptance_rate + '%' : 'N/A'}</div>
            <div>🔗 <a href="${problem.problem_url}" target="_blank">View on LeetCode</a></div>
        </div>
    `;
    
    document.getElementById('openLeetCode').onclick = () => {
        chrome.tabs.create({ url: problem.problem_url || currentProblemData.url });
    };
}

async function loadSolutions(userId, problemId) {
    try {
        // Get solutions using problem_id
        const response = await fetch(`${API_URL}/api/progress/${userId}/${problemId}`);
        if (response.ok) {
            const data = await response.json();
            const solutions = data.solutions || [];
            
            if (solutions.length === 0) {
                document.getElementById('solutionsList').innerHTML = '<p>No solutions yet. Solve this problem to see your solutions here!</p>';
                return;
            }
            
            // Backend doesn't return code in list - need to fetch each one
            displaySolutionsList(solutions, userId, problemId);
        } else {
            document.getElementById('solutionsList').innerHTML = '<p>No solutions yet. Solve this problem to see your solutions here!</p>';
        }
    } catch (error) {
        console.error('Error loading solutions:', error);
        document.getElementById('solutionsList').innerHTML = '<p>Error loading solutions.</p>';
    }
}

function displaySolutionsList(solutions, userId, problemId) {
    const solutionsDiv = document.getElementById('solutionsList');
    
    if (!solutions || solutions.length === 0) {
        solutionsDiv.innerHTML = '<p>No solutions yet.</p>';
        return;
    }
    
    // Group by language
    const byLanguage = {};
    solutions.forEach(sol => {
        if (!byLanguage[sol.language]) {
            byLanguage[sol.language] = [];
        }
        byLanguage[sol.language].push(sol);
    });
    
    // Create tabs for different languages
    const languages = Object.keys(byLanguage);
    
    let html = '<div class="solution-languages">';
    languages.forEach((lang, idx) => {
        html += `<button class="lang-tab ${idx === 0 ? 'active' : ''}" data-lang="${lang}">${lang} (${byLanguage[lang].length})</button>`;
    });
    html += '</div>';
    
    // Create content for each language
    languages.forEach((lang, idx) => {
        const sols = byLanguage[lang];
        const latest = sols[0]; // First is most recent
        
        html += `
            <div class="lang-content ${idx === 0 ? 'active' : ''}" data-lang="${lang}">
                <div class="solution-card">
                    <div class="solution-header">
                        <span class="language">${latest.language}</span>
                        <span class="date">${new Date(latest.solved_at).toLocaleDateString()}</span>
                    </div>
                    <div class="solution-stats">
                        <span>⏱️ ${latest.runtime || 'N/A'}</span>
                        <span>💾 ${latest.memory || 'N/A'}</span>
                        ${latest.github_synced ? '<span>✅ GitHub</span>' : ''}
                    </div>
                    ${sols.length > 1 ? `<div class="solution-versions">📝 ${sols.length} versions saved</div>` : ''}
                    <button class="btn-secondary view-code-btn" data-user="${userId}" data-problem="${problemId}" data-lang="${lang}">
                        View Code
                    </button>
                    <div class="solution-code" style="display:none;"></div>
                    ${latest.notes ? `<div class="solution-notes">${latest.notes}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    solutionsDiv.innerHTML = html;
    
    // Add language tab handlers
    document.querySelectorAll('.lang-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const lang = this.dataset.lang;
            
            // Update tabs
            document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update content
            document.querySelectorAll('.lang-content').forEach(c => c.classList.remove('active'));
            document.querySelector(`.lang-content[data-lang="${lang}"]`).classList.add('active');
        });
    });
    
    // Add code view handlers
    document.querySelectorAll('.view-code-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.dataset.user;
            const problemId = this.dataset.problem;
            const language = this.dataset.lang;
            const codeDiv = this.nextElementSibling;
            
            if (codeDiv.style.display === 'none') {
                // Fetch and show code
                try {
                    const response = await fetch(`${API_URL}/api/progress/${userId}/${problemId}/${language}/code`);
                    const data = await response.json();
                    codeDiv.innerHTML = `<pre><code>${escapeHtml(data.code)}</code></pre>`;
                    codeDiv.style.display = 'block';
                    this.textContent = 'Hide Code';
                } catch (error) {
                    codeDiv.innerHTML = '<p>Error loading code</p>';
                    codeDiv.style.display = 'block';
                }
            } else {
                // Hide code
                codeDiv.style.display = 'none';
                this.textContent = 'View Code';
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadProblemNotes(problemSlug) {
    const data = await chrome.storage.local.get([`notes_${problemSlug}`]);
    const notes = data[`notes_${problemSlug}`] || '';
    document.getElementById('problemNotes').value = notes;
    
    document.getElementById('saveNotes').onclick = async () => {
        const notes = document.getElementById('problemNotes').value;
        await chrome.storage.local.set({ [`notes_${problemSlug}`]: notes });
        alert('✓ Notes saved!');
    };
}

async function sendAIMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    console.log('🔵 sendAIMessage called, message:', message);
    console.log('🔵 currentProblemData:', currentProblemData);
    
    if (!message || !currentProblemData) {
        console.log('❌ No message or problem data');
        return;
    }
    
    input.value = '';
    
    // Add user message
    addChatMessage('user', message);
    
    // Show loading
    const loadingId = addChatMessage('assistant', '💭 Thinking...');
    
    try {
        // Get AI settings from backend
        const { github_user } = await chrome.storage.local.get(['github_user']);
        console.log('🔵 github_user:', github_user);
        
        if (!github_user) {
            console.log('❌ No github_user');
            removeChatMessage(loadingId);
            addChatMessage('assistant', '⚠️ Please connect GitHub first to use AI features.');
            return;
        }
        
        console.log('🔵 Fetching AI settings from:', `${API_URL}/api/ai-settings/${github_user}`);
        const response = await fetch(`${API_URL}/api/ai-settings/${github_user}`);
        console.log('🔵 AI settings response status:', response.status);
        
        if (!response.ok) {
            console.log('❌ Failed to fetch AI settings');
            removeChatMessage(loadingId);
            addChatMessage('assistant', '⚠️ Please configure your AI settings first.');
            showView('settings');
            return;
        }
        
        const aiSettings = await response.json();
        console.log('🔵 AI settings:', aiSettings);
        
        if (!aiSettings.enabled || !aiSettings.has_api_key) {
            console.log('❌ AI not enabled or no API key, enabled:', aiSettings.enabled, 'has_api_key:', aiSettings.has_api_key);
            removeChatMessage(loadingId);
            addChatMessage('assistant', '⚠️ Please configure your AI API key in settings first.');
            showView('settings');
            return;
        }
        
        // Build rich context from problem data
        let context = `Problem: ${currentProblemData.title}\n`;
        if (currentProblemData.difficulty) {
            context += `Difficulty: ${currentProblemData.difficulty}\n`;
        }
        if (currentProblemData.topics && currentProblemData.topics.length > 0) {
            context += `Topics: ${currentProblemData.topics.join(', ')}\n`;
        }
        context += `URL: ${currentProblemData.url}`;
        
        console.log('🔵 Calling AI with context:', context);
        
        // Call AI with backend settings
        const aiResponse = await callAI(message, context, aiSettings);
        
        removeChatMessage(loadingId);
        addChatMessage('assistant', aiResponse);
        
    } catch (error) {
        console.error('❌ AI Error:', error);
        removeChatMessage(loadingId);
        addChatMessage('assistant', `❌ Error: ${error.message}`);
    }
}

function addChatMessage(role, content) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageId = Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.dataset.id = messageId;
    messageDiv.textContent = content;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageId;
}

function removeChatMessage(id) {
    const message = document.querySelector(`[data-id="${id}"]`);
    if (message) message.remove();
}

async function callAI(message, context, settings) {
    const fullPrompt = `${context}\n\nUser Question: ${message}\n\nProvide a helpful, concise response. Don't give the complete solution, but guide them in the right direction.`;
    
    // Use provider from backend settings
    const provider = settings.provider || 'openai';
    
    if (provider === 'openai' || provider === 'custom' || provider === 'lm_studio') {
        return await callOpenAI(fullPrompt, settings);
    } else if (provider === 'anthropic') {
        return await callAnthropic(fullPrompt, settings);
    } else {
        throw new Error('Provider not supported yet');
    }
}

async function callOpenAI(prompt, settings) {
    const baseUrl = settings.api_base_url || 'https://api.openai.com/v1';
    console.log('🔵 callOpenAI - baseUrl:', baseUrl);
    
    // For backend settings, we need to fetch the API key separately (not returned for security)
    const { github_user } = await chrome.storage.local.get(['github_user']);
    
    // Try to get decrypted API key from backend
    let apiKey = null;
    try {
        console.log('🔵 Fetching API key from:', `${API_URL}/api/ai-settings/${github_user}/key`);
        const keyResponse = await fetch(`${API_URL}/api/ai-settings/${github_user}/key`);
        console.log('🔵 Key response status:', keyResponse.status);
        
        if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            apiKey = keyData.api_key;
            console.log('✅ Got API key from backend:', apiKey ? apiKey.substring(0, 10) + '...' : 'null');
        } else {
            console.error('❌ Failed to fetch API key, status:', keyResponse.status);
        }
    } catch (e) {
        console.error('❌ Error fetching API key:', e);
    }
    
    if (!apiKey) {
        throw new Error('API key not configured. Please re-enter your API key in settings.');
    }
    
    const url = `${baseUrl}/chat/completions`;
    console.log('🔵 Calling OpenAI API:', url);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: settings.model_name || 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful coding assistant for LeetCode problems.' },
                { role: 'user', content: prompt }
            ]
        })
    });
    
    console.log('🔵 OpenAI response status:', response.status);
    
    const data = await response.json();
    console.log('🔵 OpenAI response data:', data);
    
    if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }
    
    return data.choices[0].message.content;
}

async function callAnthropic(prompt, settings) {
    const baseUrl = settings.api_base_url || 'https://api.anthropic.com/v1';
    
    // Try to get decrypted API key from backend
    const { github_user } = await chrome.storage.local.get(['github_user']);
    let apiKey = null;
    try {
        const keyResponse = await fetch(`${API_URL}/api/ai-settings/${github_user}/key`);
        if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            apiKey = keyData.api_key;
        }
    } catch (e) {
        console.log('Could not fetch API key from backend');
    }
    
    if (!apiKey) {
        throw new Error('API key not configured. Please re-enter your API key in settings.');
    }
    
    const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: settings.model_name || 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }
    
    return data.content[0].text;
}
