// AI Settings logic

const API_URL = 'http://localhost:8001';
let providers = [];
let selectedProvider = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProviders();
    loadExistingSettings();
});

async function loadProviders() {
    try {
        const response = await fetch(`${API_URL}/api/ai-settings/providers`);
        providers = await response.json();
        
        displayProviders();
    } catch (error) {
        console.error('Error loading providers:', error);
        showStatus('Failed to load AI providers', 'error');
    }
}

function displayProviders() {
    const grid = document.getElementById('provider-grid');
    grid.innerHTML = '';
    
    providers.forEach(provider => {
        const card = document.createElement('div');
        card.className = 'provider-card';
        card.onclick = () => selectProvider(provider);
        
        card.innerHTML = `
            <div class="provider-name">${provider.name}</div>
            <div class="provider-desc">${provider.description || ''}</div>
        `;
        
        grid.appendChild(card);
    });
}

function selectProvider(provider) {
    selectedProvider = provider;
    
    // Update UI
    document.querySelectorAll('.provider-card').forEach((card, index) => {
        card.classList.toggle('active', providers[index].name === provider.name);
    });
    
    // Set default values
    document.getElementById('base-url').value = provider.default_base_url || '';
    document.getElementById('model').value = provider.default_model || '';
    
    // Show/hide base URL field
    const baseUrlGroup = document.getElementById('base-url-group');
    if (provider.name === 'Custom' || provider.name === 'Ollama' || provider.name === 'LM Studio') {
        baseUrlGroup.style.display = 'block';
    } else {
        baseUrlGroup.style.display = 'none';
    }
}

async function loadExistingSettings() {
    try {
        const { github_user, ai_settings } = await chrome.storage.local.get(['github_user', 'ai_settings']);
        
        if (ai_settings) {
            // Load from local storage first
            selectProviderByName(ai_settings.provider);
            document.getElementById('base-url').value = ai_settings.base_url || '';
            document.getElementById('model').value = ai_settings.model || '';
            document.getElementById('api-key').value = ai_settings.api_key || '';
        } else if (github_user) {
            // Try to load from API
            const userId = github_user.login;
            const response = await fetch(`${API_URL}/api/ai-settings/${userId}`);
            
            if (response.ok) {
                const settings = await response.json();
                selectProviderByName(settings.provider_name);
                document.getElementById('base-url').value = settings.base_url || '';
                document.getElementById('model').value = settings.model_name || '';
                // Don't pre-fill API key for security
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function selectProviderByName(providerName) {
    const provider = providers.find(p => p.name === providerName);
    if (provider) {
        selectProvider(provider);
    }
}

async function saveSettings() {
    if (!selectedProvider) {
        showStatus('Please select a provider', 'error');
        return;
    }
    
    const baseUrl = document.getElementById('base-url').value;
    const model = document.getElementById('model').value;
    const apiKey = document.getElementById('api-key').value;
    
    if (!model) {
        showStatus('Please enter a model name', 'error');
        return;
    }
    
    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }
    
    const settings = {
        provider: selectedProvider.name,
        base_url: baseUrl,
        model: model,
        api_key: apiKey
    };
    
    try {
        // Save to local storage
        await chrome.storage.local.set({ ai_settings: settings });
        
        // Also save to API if user is logged in
        const { github_user } = await chrome.storage.local.get(['github_user']);
        if (github_user) {
            const userId = github_user.login;
            
            await fetch(`${API_URL}/api/ai-settings/${userId}/configure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider_name: selectedProvider.name,
                    base_url: baseUrl || null,
                    model_name: model,
                    api_key_encrypted: apiKey // Will be encrypted in backend
                })
            });
        }
        
        showStatus('✅ Settings saved successfully!', 'success');
        
        setTimeout(() => {
            window.close();
        }, 1500);
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Failed to save settings', 'error');
    }
}

async function testConnection() {
    if (!selectedProvider) {
        showStatus('Please select a provider first', 'error');
        return;
    }
    
    const apiKey = document.getElementById('api-key').value;
    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }
    
    showStatus('Testing connection...', 'info');
    
    try {
        const { github_user } = await chrome.storage.local.get(['github_user']);
        if (!github_user) {
            showStatus('Please login with GitHub first', 'error');
            return;
        }
        
        const userId = github_user.login;
        const baseUrl = document.getElementById('base-url').value;
        const model = document.getElementById('model').value;
        
        const response = await fetch(`${API_URL}/api/ai-settings/${userId}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider_name: selectedProvider.name,
                base_url: baseUrl || null,
                model_name: model,
                api_key_encrypted: apiKey
            })
        });
        
        if (response.ok) {
            showStatus('✅ Connection successful!', 'success');
        } else {
            const error = await response.json();
            showStatus('❌ Connection failed: ' + (error.detail || 'Unknown error'), 'error');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        showStatus('❌ Connection test failed', 'error');
    }
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}
