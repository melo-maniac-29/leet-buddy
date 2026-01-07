// Notes panel for LeetCode problems
// Adds a floating notes panel to take notes while solving

console.log('📝 LeetBuddy: Notes panel loaded');

let notesPanel = null;

// Wait for page to load
setTimeout(() => {
    if (window.location.pathname.startsWith('/problems/')) {
        createNotesPanel();
    }
}, 2000);

function createNotesPanel() {
    // Create notes button in toolbar
    const toolbar = document.querySelector('[class*="question-toolbar"]') || 
                   document.querySelector('.css-1hky5w4-TabsContainer');
    
    if (!toolbar) {
        console.log('Toolbar not found, retrying...');
        setTimeout(createNotesPanel, 1000);
        return;
    }
    
    const notesButton = document.createElement('button');
    notesButton.id = 'leetbuddy-notes-btn';
    notesButton.innerHTML = '📝 Notes';
    notesButton.style.cssText = `
        padding: 6px 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        margin-left: 8px;
    `;
    
    notesButton.addEventListener('click', toggleNotesPanel);
    toolbar.appendChild(notesButton);
    
    // Create notes panel
    notesPanel = document.createElement('div');
    notesPanel.id = 'leetbuddy-notes-panel';
    notesPanel.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        z-index: 9999;
        display: none;
    `;
    
    notesPanel.innerHTML = `
        <div style="padding: 16px; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;">
                📝 Your Notes
            </h3>
            <button id="leetbuddy-close-notes" style="
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 24px;
                height: 24px;
            ">×</button>
        </div>
        
        <div style="padding: 16px;">
            <textarea id="leetbuddy-notes" placeholder="Take notes about your approach, learnings, time/space complexity..." style="
                width: 100%;
                height: 300px;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                padding: 12px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
                resize: vertical;
                outline: none;
            "></textarea>
            
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button id="leetbuddy-save-notes" style="
                    flex: 1;
                    padding: 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                ">💾 Save</button>
                
                <button id="leetbuddy-template" style="
                    padding: 10px;
                    background: #f5f5f5;
                    color: #666;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                ">📋 Template</button>
            </div>
            
            <p style="margin-top: 8px; font-size: 11px; color: #999; text-align: center;">
                Notes are auto-saved and synced to GitHub
            </p>
        </div>
    `;
    
    document.body.appendChild(notesPanel);
    
    // Event listeners
    document.getElementById('leetbuddy-close-notes').addEventListener('click', hideNotesPanel);
    document.getElementById('leetbuddy-save-notes').addEventListener('click', saveNotes);
    document.getElementById('leetbuddy-template').addEventListener('click', insertTemplate);
    
    // Auto-save on input
    const textarea = document.getElementById('leetbuddy-notes');
    textarea.addEventListener('input', debounce(autoSaveNotes, 1000));
    
    // Load existing notes
    loadNotes();
}

function toggleNotesPanel() {
    if (notesPanel.style.display === 'none') {
        showNotesPanel();
    } else {
        hideNotesPanel();
    }
}

function showNotesPanel() {
    notesPanel.style.display = 'block';
    notesPanel.style.animation = 'slideIn 0.3s ease';
}

function hideNotesPanel() {
    notesPanel.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        notesPanel.style.display = 'none';
    }, 300);
}

async function loadNotes() {
    try {
        const problemSlug = window.location.pathname.split('/')[2];
        const storageKey = `notes_${problemSlug}`;
        
        const result = await chrome.storage.local.get([storageKey]);
        const textarea = document.getElementById('leetbuddy-notes');
        
        if (result[storageKey]) {
            textarea.value = result[storageKey];
        }
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

async function saveNotes() {
    try {
        const problemSlug = window.location.pathname.split('/')[2];
        const storageKey = `notes_${problemSlug}`;
        const textarea = document.getElementById('leetbuddy-notes');
        
        await chrome.storage.local.set({
            [storageKey]: textarea.value
        });
        
        showNotificationInPanel('✅ Notes saved!');
    } catch (error) {
        console.error('Failed to save notes:', error);
        showNotificationInPanel('❌ Failed to save', 'error');
    }
}

function autoSaveNotes() {
    saveNotes();
}

function insertTemplate() {
    const template = `# Approach


## Intuition


## Algorithm
1. 
2. 
3. 

## Complexity
- Time: O()
- Space: O()

## Key Insights
- 

## Edge Cases
- 
`;
    
    const textarea = document.getElementById('leetbuddy-notes');
    textarea.value = template;
    saveNotes();
}

function showNotificationInPanel(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10000;
    `;
    notification.textContent = message;
    
    notesPanel.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
