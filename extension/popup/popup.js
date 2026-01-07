// Extension popup logic

// DOM Elements
const connectGitHubBtn = document.getElementById('connectGitHub');
const disconnectBtn = document.getElementById('disconnect');
const connectionSection = document.getElementById('connectionSection');
const connectedView = document.getElementById('connectedView');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Settings
const autoSyncEnabled = document.getElementById('autoSyncEnabled');
const includeNotes = document.getElementById('includeNotes');
const organizeByTopic = document.getElementById('organizeByTopic');
const autoContribute = document.getElementById('autoContribute');

// User info
const userAvatar = document.getElementById('userAvatar');
const username = document.getElementById('username');
const repoName = document.getElementById('repoName');

// Stats
const solvedCount = document.getElementById('solvedCount');
const syncedCount = document.getElementById('syncedCount');
const contributedCount = document.getElementById('contributedCount');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await checkConnection();
    setupEventListeners();
});

// Check GitHub connection
async function checkConnection() {
    try {
        const result = await chrome.storage.local.get(['github_token', 'github_user', 'github_repo', 'stats']);
        
        if (result.github_token && result.github_user) {
            showConnectedView(result.github_user, result.github_repo, result.stats || {});
        } else {
            showConnectionSection();
        }
    } catch (error) {
        console.error('Error checking connection:', error);
        showConnectionSection();
    }
}

// Show connection section
function showConnectionSection() {
    connectionSection.style.display = 'block';
    connectedView.style.display = 'none';
    statusIndicator.classList.remove('connected');
    statusText.textContent = 'Not Connected';
}

// Show connected view
function showConnectedView(user, repo, stats) {
    connectionSection.style.display = 'none';
    connectedView.style.display = 'block';
    statusIndicator.classList.add('connected');
    statusText.textContent = 'Connected';
    
    // Update user info
    userAvatar.src = user.avatar_url || '../assets/icon-48.png';
    username.textContent = user.login || user.name || 'User';
    repoName.textContent = repo || 'No repository selected';
    
    // Update stats
    solvedCount.textContent = stats.solved || 0;
    syncedCount.textContent = stats.synced || 0;
    contributedCount.textContent = stats.contributed || 0;
}

// Setup event listeners
function setupEventListeners() {
    // Connect GitHub
    connectGitHubBtn.addEventListener('click', async () => {
        try {
            // Send message to background script to initiate OAuth
            chrome.runtime.sendMessage({ action: 'authenticate_github' }, response => {
                if (response.success) {
                    checkConnection();
                } else {
                    alert('Failed to connect GitHub: ' + response.error);
                }
            });
        } catch (error) {
            console.error('Error connecting GitHub:', error);
            alert('Failed to connect GitHub');
        }
    });
    
    // View stats
    document.getElementById('viewStats').addEventListener('click', () => {
        chrome.tabs.create({ url: 'stats/stats.html' });
    });
    
    // Disconnect
    disconnectBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to disconnect GitHub?')) {
            await chrome.storage.local.remove(['github_token', 'github_user', 'github_repo']);
            showConnectionSection();
        }
    });
    
    // Settings change listeners
    autoSyncEnabled.addEventListener('change', saveSettings);
    includeNotes.addEventListener('change', saveSettings);
    organizeByTopic.addEventListener('change', saveSettings);
    autoContribute.addEventListener('change', saveSettings);
}

// Load settings
async function loadSettings() {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {
        autoSync: true,
        includeNotes: true,
        organizeByTopic: true,
        autoContribute: true
    };
    
    autoSyncEnabled.checked = settings.autoSync;
    includeNotes.checked = settings.includeNotes;
    organizeByTopic.checked = settings.organizeByTopic;
    autoContribute.checked = settings.autoContribute;
}

// Save settings
async function saveSettings() {
    const settings = {
        autoSync: autoSyncEnabled.checked,
        includeNotes: includeNotes.checked,
        organizeByTopic: organizeByTopic.checked,
        autoContribute: autoContribute.checked
    };
    
    await chrome.storage.local.set({ settings });
    
    // Notify background script of settings change
    chrome.runtime.sendMessage({ 
        action: 'settings_updated', 
        settings 
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'update_stats') {
        const stats = message.stats;
        solvedCount.textContent = stats.solved || 0;
        syncedCount.textContent = stats.synced || 0;
        contributedCount.textContent = stats.contributed || 0;
    }
    
    if (message.action === 'sync_success') {
        // Show success notification
        syncedCount.textContent = parseInt(syncedCount.textContent) + 1;
    }
});
