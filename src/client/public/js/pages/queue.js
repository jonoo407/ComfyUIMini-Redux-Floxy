async function loadQueue() {
    const queueContainer = document.getElementById('queue-container');
    
    try {
        const response = await fetch('/api/queue');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const queueData = await response.json();
        await displayQueue(queueData);
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

async function displayQueue(queueData) {
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
        const completedItems = Array.isArray(queueData.queue_completed) ? queueData.queue_completed : [queueData.queue_completed];

        // Handle all items concurrently for better performance
        const pendingPromises = pendingItems.map(item => createQueueItemHtml(item, 'pending'));
        const runningPromises = runningItems.map(item => createQueueItemHtml(item, 'running'));
        const completedPromises = completedItems.reverse().map(item => createQueueItemHtml(item, 'completed'));
        
        // Wait for all promises to resolve
        const [pendingResults, runningResults, completedResults] = await Promise.all([
            Promise.all(pendingPromises),
            Promise.all(runningPromises),
            Promise.all(completedPromises)
        ]);
        
        // Combine all results
        html += pendingResults.join('');
        html += runningResults.join('');
        html += completedResults.join('');
        
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

async function createQueueItemHtml(item, status = 'pending') {
    const promptId = item[1];
    const title = `Item ${promptId}`;
    let imagesHtml = '';
    
    if (status === 'completed') {
        try {
            console.log(item);
            // Fetch history for the completed item
            const response = await fetch(`/comfyui/history/${promptId}`);
            if (response.ok) {
                const historyData = await response.json();
                
                // Extract image URLs from the history response
                const imageUrls = [];
                if (historyData[promptId] && historyData[promptId].outputs) {
                    Object.values(historyData[promptId].outputs).forEach(output => {
                        if (output.images) {
                            output.images.forEach(image => {
                                const imageUrl = `/comfyui/image?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                                imageUrls.push(imageUrl);
                            });
                        }
                    });
                }
                
                // Create HTML for images
                if (imageUrls.length > 0) {
                    imagesHtml = `
                        <div class="queue-item-images">
                            ${imageUrls.map(url => `
                                <div class="image-item">
                                    <img src="${url}" alt="Generated image">
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error fetching history for completed item:', error);
        }
    }
    
    return `
        <div class="queue-item">
            <div class="queue-item-header">
                <div class="queue-item-info">
                    <div class="queue-item-title">${title}</div>
                </div>
                <div class="queue-item-status ${status}">
                    ${status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
            </div>
            ${imagesHtml}
        </div>
    `;
}

// Load queue when page loads
document.addEventListener('DOMContentLoaded', loadQueue);

// Set up periodic refresh to show completed items
setInterval(loadQueue, 60000); // Refresh every minute 