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
    const settings = await chrome.storage.local.get(['apiUrl', 'autoSync']);
    if (settings.apiUrl) {
        API_URL = settings.apiUrl;
        document.getElementById('apiUrl').value = settings.apiUrl;
    }
    if (settings.autoSync !== undefined) {
        document.getElementById('autoSync').checked = settings.autoSync;
    }
}

async function saveSettings() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const autoSync = document.getElementById('autoSync').checked;
    
    await chrome.storage.local.set({ apiUrl, autoSync });
    API_URL = apiUrl;
    
    alert('✓ Settings saved!');
    showView('home');
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
    chrome.runtime.sendMessage({ action: 'authenticate_github' }, (response) => {
        if (response && response.success) {
            setTimeout(checkGitHub, 1000);
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
    
    item.addEventListener('click', () => {
        chrome.tabs.create({ url: `https://leetcode.com/problems/${problem.title_slug}/` });
    });
    
    return item;
}

// Problem View Functions
let currentProblemData = null;

async function loadProblemView(data) {
    currentProblemData = data;
    document.getElementById('problemTitle').textContent = data.title;
    
    // Load problem details from our DB
    try {
        const response = await fetch(`${API_URL}/api/problems/${data.slug}`);
        if (response.ok) {
            const problem = await response.json();
            displayProblemDetails(problem);
        }
    } catch (error) {
        console.error('Error loading problem:', error);
    }
    
    // Load user's solutions
    const { github_user } = await chrome.storage.local.get(['github_user']);
    if (github_user) {
        loadSolutions(github_user, data.slug);
    }
    
    // Load notes
    loadProblemNotes(data.slug);
    
    showView('problem');
}

function displayProblemDetails(problem) {
    const detailsDiv = document.getElementById('problemDetails');
    detailsDiv.innerHTML = `
        <div class="prob-info">
            <span class="difficulty ${problem.difficulty?.toLowerCase()}">${problem.difficulty}</span>
            <span class="topic-tags">${problem.topics?.join(', ') || ''}</span>
        </div>
        <div class="prob-description">
            ${problem.description || 'No description available'}
        </div>
        <div class="prob-stats">
            <div>📊 Acceptance: ${problem.acceptance_rate || 'N/A'}</div>
            <div>🎯 Frequency: ${problem.frequency || 'N/A'}</div>
        </div>
    `;
    
    document.getElementById('openLeetCode').onclick = () => {
        chrome.tabs.create({ url: currentProblemData.url });
    };
}

async function loadSolutions(userId, problemSlug) {
    try {
        const response = await fetch(`${API_URL}/api/progress/${userId}/${problemSlug}`);
        if (response.ok) {
            const solutions = await response.json();
            displaySolutions(solutions);
        } else {
            document.getElementById('solutionsList').innerHTML = '<p>No solutions yet. Solve this problem to see your solutions here!</p>';
        }
    } catch (error) {
        console.error('Error loading solutions:', error);
        document.getElementById('solutionsList').innerHTML = '<p>Error loading solutions.</p>';
    }
}

function displaySolutions(solutions) {
    const solutionsDiv = document.getElementById('solutionsList');
    
    if (!solutions || solutions.length === 0) {
        solutionsDiv.innerHTML = '<p>No solutions yet.</p>';
        return;
    }
    
    const html = solutions.map(sol => `
        <div class="solution-card">
            <div class="solution-header">
                <span class="language">${sol.language}</span>
                <span class="date">${new Date(sol.solved_at).toLocaleDateString()}</span>
            </div>
            <div class="solution-stats">
                <span>⏱️ ${sol.runtime}ms</span>
                <span>💾 ${sol.memory_usage}MB</span>
            </div>
            <pre><code>${sol.solution_code}</code></pre>
            ${sol.notes ? `<div class="solution-notes">${sol.notes}</div>` : ''}
        </div>
    `).join('');
    
    solutionsDiv.innerHTML = html;
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
    
    if (!message || !currentProblemData) return;
    
    input.value = '';
    
    // Add user message
    addChatMessage('user', message);
    
    // Show loading
    const loadingId = addChatMessage('assistant', '💭 Thinking...');
    
    try {
        const settings = await chrome.storage.local.get(['aiProvider', 'aiApiKey', 'aiModel']);
        
        if (!settings.aiApiKey) {
            removeChatMessage(loadingId);
            addChatMessage('assistant', '⚠️ Please configure your AI API key in settings first.');
            showView('settings');
            return;
        }
        
        // Get problem context
        const response = await fetch(`${API_URL}/api/problems/${currentProblemData.slug}`);
        const problem = await response.json();
        
        // Call AI
        const aiResponse = await callAI(message, problem, settings);
        
        removeChatMessage(loadingId);
        addChatMessage('assistant', aiResponse);
        
    } catch (error) {
        console.error('AI Error:', error);
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

async function callAI(message, problem, settings) {
    const context = `Problem: ${problem.title}\n\nDifficulty: ${problem.difficulty}\nTopics: ${problem.topics?.join(', ')}\n\nDescription: ${problem.description?.substring(0, 500)}`;
    
    const fullPrompt = `${context}\n\nUser Question: ${message}\n\nProvide a helpful, concise response. Don't give the complete solution, but guide them in the right direction.`;
    
    if (settings.aiProvider === 'openai') {
        return await callOpenAI(fullPrompt, settings);
    } else if (settings.aiProvider === 'anthropic') {
        return await callAnthropic(fullPrompt, settings);
    } else {
        throw new Error('Provider not supported yet');
    }
}

async function callOpenAI(prompt, settings) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.aiApiKey}`
        },
        body: JSON.stringify({
            model: settings.aiModel || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful coding assistant for LeetCode problems.' },
                { role: 'user', content: prompt }
            ]
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    return data.choices[0].message.content;
}

async function callAnthropic(prompt, settings) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.aiApiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: settings.aiModel || 'claude-3-sonnet-20240229',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }
    
    return data.content[0].text;
}
