// Roadmap selector page logic

const API_URL = 'http://localhost:8001';

// Load roadmaps on page load
document.addEventListener('DOMContentLoaded', () => {
    loadRoadmaps();
});

async function loadRoadmaps() {
    try {
        const response = await fetch(`${API_URL}/api/roadmaps`);
        
        if (!response.ok) {
            throw new Error('Failed to load roadmaps');
        }
        
        const roadmaps = await response.json();
        
        // Separate curated and topic roadmaps
        const curated = roadmaps.filter(r => r.category === 'curated');
        const topics = roadmaps.filter(r => r.category === 'topic');
        
        displayRoadmaps(curated, topics);
        
    } catch (error) {
        console.error('Error loading roadmaps:', error);
        showError('Failed to load roadmaps. Make sure the API is running.');
    }
}

function displayRoadmaps(curated, topics) {
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    
    // Show sections
    document.getElementById('curated-section').style.display = 'block';
    document.getElementById('topics-section').style.display = 'block';
    
    // Display curated roadmaps
    const curatedContainer = document.getElementById('curated-roadmaps');
    curatedContainer.innerHTML = '';
    
    curated.forEach(roadmap => {
        const card = createRoadmapCard(roadmap);
        curatedContainer.appendChild(card);
    });
    
    // Store topics for later
    window.topicRoadmaps = topics;
}

function createRoadmapCard(roadmap) {
    const card = document.createElement('div');
    card.className = 'roadmap-card';
    card.onclick = () => selectRoadmap(roadmap);
    
    const diff = roadmap.difficulty_distribution || {};
    const easy = diff.Easy || 0;
    const medium = diff.Medium || 0;
    const hard = diff.Hard || 0;
    
    card.innerHTML = `
        <div class="roadmap-name">${roadmap.display_name}</div>
        <div class="roadmap-description">${roadmap.description || ''}</div>
        <div class="roadmap-stats">
            <div class="stat"><strong>${roadmap.total_problems}</strong> problems</div>
        </div>
        <div class="difficulty-dots">
            ${createDots('easy', easy)}
            ${createDots('medium', medium)}
            ${createDots('hard', hard)}
        </div>
    `;
    
    return card;
}

function createDots(type, count) {
    if (count === 0) return '';
    
    const max = 10;
    const displayCount = Math.min(count, max);
    const dots = Array(displayCount).fill(`<div class="dot ${type}"></div>`).join('');
    const label = count > max ? `${count}` : '';
    
    return `<div style="display:flex;gap:2px;align-items:center;">${dots}${label ? `<span style="font-size:10px;color:#888;margin-left:4px;">${label}</span>` : ''}</div>`;
}

function selectRoadmap(roadmap) {
    console.log('Selected roadmap:', roadmap);
    
    // Save active roadmap
    chrome.storage.local.set({ 
        active_roadmap: roadmap.name 
    }, () => {
        // Activate roadmap via API
        activateRoadmap(roadmap.name);
        
        // Open problem browser
        window.location.href = `../problems/problems.html?roadmap=${encodeURIComponent(roadmap.name)}`;
    });
}

async function activateRoadmap(roadmapName) {
    try {
        const { github_user } = await chrome.storage.local.get(['github_user']);
        const userId = github_user?.login || 'guest';
        
        await fetch(`${API_URL}/api/roadmaps/${roadmapName}/activate/${userId}`, {
            method: 'POST'
        });
        
        console.log('✅ Roadmap activated:', roadmapName);
    } catch (error) {
        console.error('Failed to activate roadmap:', error);
    }
}

function showTopics() {
    // Navigate to topics page
    window.location.href = `topics.html`;
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'block';
    errorDiv.className = 'error';
    errorDiv.textContent = '❌ ' + message;
}
