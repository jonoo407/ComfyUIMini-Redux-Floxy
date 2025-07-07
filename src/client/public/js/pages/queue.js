async function loadQueue() {
    const queueContainer = document.getElementById('queue-container');
    
    try {
        const response = await fetch('/api/queue');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const queueData = await response.json();
        displayQueue(queueData);
    } catch (error) {
        console.error('Error loading queue:', error);
        queueContainer.innerHTML = `
            <div class="error">
                <p>Failed to load queue data. Please try again later.</p>
                <button onclick="loadQueue()">Retry</button>
            </div>
        `;
    }
}

function displayQueue(queueData) {
    const queueContainer = document.getElementById('queue-container');
    
    if (!queueData || (Array.isArray(queueData) && queueData.length === 0)) {
        queueContainer.innerHTML = `
            <div class="empty-queue">
                <div class="icon clock"></div>
                <h3>Queue is Empty</h3>
                <p>No items are currently in the queue.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    if (queueData.queue_running && queueData.queue_pending) {
        // If it has queue_running and queue_pending properties
        const runningItems = Array.isArray(queueData.queue_running) ? queueData.queue_running : [queueData.queue_running];
        const pendingItems = Array.isArray(queueData.queue_pending) ? queueData.queue_pending : [queueData.queue_pending];
        
        // Filter out null/undefined items
        const allItems = [...runningItems, ...pendingItems].filter(item => item);

        if (allItems.length === 0) {
            queueContainer.innerHTML = `
                <div class="empty-queue">
                    <div class="icon clock"></div>
                    <h3>Queue is Empty</h3>
                    <p>No items are currently in the queue.</p>
                </div>
            `;
            return;
        }

        
        allItems.forEach((item, index) => {
            const status = index < runningItems.length ? 'running' : 'pending';
            html += createQueueItemHtml(item, status);
        });
    } else {
        // Fallback: display the entire object as JSON
        html = `
            <div class="queue-item">
                <div class="queue-item-info">
                    <div class="queue-item-title">Queue Data</div>
                    <div class="queue-item-details">
                        <pre>${JSON.stringify(queueData, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
    }
    
    queueContainer.innerHTML = html;
}

function createQueueItemHtml(item, status = 'pending') {
    const title = `Item ${item[1] }`;
    const details = [];
    
    return `
        <div class="queue-item">
            <div class="queue-item-info">
                <div class="queue-item-title">${title}</div>
                <div class="queue-item-details">
                    ${details.join(' • ')}
                </div>
            </div>
            <div class="queue-item-status ${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
        </div>
    `;
}

// Load queue when page loads
document.addEventListener('DOMContentLoaded', loadQueue); 