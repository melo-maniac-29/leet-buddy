// Stats page logic

document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await loadActivity();
    await loadRepoInfo();
});

// Load statistics
async function loadStats() {
    try {
        const result = await chrome.storage.local.get(['stats', 'activity']);
        const stats = result.stats || { solved: 0, synced: 0, contributed: 0 };
        const activity = result.activity || [];
        
        // Update overview stats
        document.getElementById('totalSolved').textContent = stats.solved || 0;
        document.getElementById('totalSynced').textContent = stats.synced || 0;
        document.getElementById('totalContributed').textContent = stats.contributed || 0;
        
        // Calculate difficulty breakdown
        const difficulties = { easy: 0, medium: 0, hard: 0 };
        
        for (const item of activity) {
            const diff = item.difficulty?.toLowerCase();
            if (diff === 'easy') difficulties.easy++;
            else if (diff === 'medium') difficulties.medium++;
            else if (diff === 'hard') difficulties.hard++;
        }
        
        document.getElementById('easyCount').textContent = difficulties.easy;
        document.getElementById('mediumCount').textContent = difficulties.medium;
        document.getElementById('hardCount').textContent = difficulties.hard;
        
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load recent activity
async function loadActivity() {
    try {
        const result = await chrome.storage.local.get(['activity']);
        const activity = result.activity || [];
        
        const activityList = document.getElementById('activityList');
        
        if (activity.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No activity yet. Start solving problems!</p>';
            return;
        }
        
        // Sort by date (most recent first)
        activity.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Show last 10 activities
        activityList.innerHTML = activity.slice(0, 10).map(item => `
            <div class="activity-item">
                <div class="activity-info">
                    <h3>${item.problemTitle || 'Problem ' + item.problemId}</h3>
                    <p>${formatDate(item.date)} • ${item.language || 'Unknown'}</p>
                </div>
                <span class="activity-badge ${item.type}">
                    ${item.type === 'synced' ? '📤 Synced' : '🎉 Contributed'}
                </span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load activity:', error);
    }
}

// Load repository info
async function loadRepoInfo() {
    try {
        const result = await chrome.storage.local.get(['github_repo', 'github_user']);
        const repo = result.github_repo;
        const user = result.github_user;
        
        const repoInfo = document.getElementById('repoInfo');
        
        if (!repo) {
            repoInfo.innerHTML = '<p class="empty-state">No repository connected. Go to the popup to select one!</p>';
            return;
        }
        
        repoInfo.innerHTML = `
            <div class="repo-icon">📦</div>
            <div class="repo-details">
                <h3>${repo}</h3>
                <p>Connected as ${user?.login || 'User'}</p>
            </div>
            <a href="https://github.com/${repo}" target="_blank" class="repo-link">
                View on GitHub →
            </a>
        `;
        
    } catch (error) {
        console.error('Failed to load repo info:', error);
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}
