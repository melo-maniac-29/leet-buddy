// Topics page logic

const API_URL = 'http://localhost:8001';

document.addEventListener('DOMContentLoaded', () => {
    loadTopics();
});

async function loadTopics() {
    try {
        const response = await fetch(`${API_URL}/api/roadmaps`);
        const roadmaps = await response.json();
        
        // Filter and sort topics
        const topics = roadmaps
            .filter(r => r.category === 'topic')
            .sort((a, b) => (a.learning_order || 999) - (b.learning_order || 999));
        
        displayTopics(topics);
        
    } catch (error) {
        console.error('Error loading topics:', error);
        alert('Failed to load topics. Make sure the API is running.');
    }
}

function displayTopics(topics) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('topics-container').style.display = 'block';
    
    const container = document.getElementById('topic-list');
    container.innerHTML = '';
    
    topics.forEach((topic, index) => {
        const item = document.createElement('div');
        item.className = 'topic-item';
        item.onclick = () => selectTopic(topic);
        
        const topicName = topic.display_name.replace(' Mastery', '');
        
        item.innerHTML = `
            <div class="topic-order">#${index + 1}</div>
            <div class="topic-name">${topicName}</div>
            <div class="topic-count">${topic.total_problems} problems</div>
        `;
        
        container.appendChild(item);
    });
}

function selectTopic(topic) {
    // Save and navigate to problems
    chrome.storage.local.set({ 
        active_roadmap: topic.name 
    }, () => {
        window.location.href = `../problems/problems.html?roadmap=${encodeURIComponent(topic.name)}`;
    });
}
