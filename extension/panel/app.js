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
    document.getElementById('backSettings').addEventListener('click', () => showView('home'));
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('testConnection').addEventListener('click', testConnection);
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
    
    if (view === 'home') {
        document.getElementById('homeView').classList.add('active');
    } else if (view === 'detail') {
        document.getElementById('detailView').classList.add('active');
    } else if (view === 'topics') {
        document.getElementById('topicsView').classList.add('active');
    } else if (view === 'settings') {
        document.getElementById('settingsView').classList.add('active');
    }
    
    currentView = view;
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
