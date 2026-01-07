// Problem browser logic

const API_URL = 'http://localhost:8001';
let allProblems = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roadmapName = urlParams.get('roadmap');
    
    if (roadmapName) {
        loadProblems(roadmapName);
    } else {
        alert('No roadmap selected');
        window.history.back();
    }
});

async function loadProblems(roadmapName) {
    try {
        // Get user ID
        const { github_user } = await chrome.storage.local.get(['github_user']);
        const userId = github_user?.login || 'guest';
        
        // Fetch problems with progress
        const url = `${API_URL}/api/roadmaps/${roadmapName}/problems?user_id=${userId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to load problems');
        }
        
        const data = await response.json();
        allProblems = data.problems || [];
        
        // Update header
        const displayName = roadmapName.startsWith('topic_') 
            ? roadmapName.replace('topic_', '').replace(/_/g, ' ')
            : roadmapName;
        
        document.getElementById('roadmap-name').textContent = displayName;
        
        // Calculate and display stats
        const completed = allProblems.filter(p => p.completed).length;
        const total = allProblems.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('stats').innerHTML = `
            <div class="stat-item"><strong>${completed}</strong> / ${total} completed</div>
            <div class="stat-item"><strong>${progress}%</strong> progress</div>
        `;
        
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Display problems
        displayProblems(allProblems);
        
    } catch (error) {
        console.error('Error loading problems:', error);
        document.getElementById('loading').innerHTML = `
            <div style="color: #ef4444;">
                ❌ Failed to load problems. Make sure the API is running.
            </div>
        `;
    }
}

function displayProblems(problems) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('problems-container').style.display = 'block';
    
    const container = document.getElementById('problems-container');
    container.innerHTML = '';
    
    if (problems.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #888;">No problems found</div>';
        return;
    }
    
    problems.forEach(problem => {
        const row = createProblemRow(problem);
        container.appendChild(row);
    });
}

function createProblemRow(problem) {
    const row = document.createElement('div');
    row.className = `problem-row ${problem.completed ? 'completed' : ''}`;
    
    const topics = problem.topics?.slice(0, 3) || [];
    const topicsHtml = topics.map(t => `<span class="topic-tag">${t}</span>`).join('');
    
    row.innerHTML = `
        <div class="checkbox ${problem.completed ? 'checked' : ''}">
            ${problem.completed ? '✓' : ''}
        </div>
        <div class="problem-id">#${problem.problem_id}</div>
        <div>
            <div class="problem-title">${problem.title}</div>
            <div class="problem-topics">${topicsHtml}</div>
        </div>
        <div class="acceptance">${problem.acceptance_rate ? Math.round(problem.acceptance_rate) + '%' : '-'}</div>
        <div class="difficulty ${problem.difficulty}">${problem.difficulty}</div>
        <button class="action-btn" onclick="openProblem(event, '${problem.title_slug}')">Solve</button>
    `;
    
    return row;
}

function filterProblems(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Filter problems
    let filtered = allProblems;
    
    if (filter === 'completed') {
        filtered = allProblems.filter(p => p.completed);
    } else if (filter === 'todo') {
        filtered = allProblems.filter(p => !p.completed);
    } else if (filter !== 'all') {
        filtered = allProblems.filter(p => p.difficulty === filter);
    }
    
    displayProblems(filtered);
}

function openProblem(event, titleSlug) {
    event.stopPropagation();
    const url = `https://leetcode.com/problems/${titleSlug}/`;
    chrome.tabs.create({ url });
}
