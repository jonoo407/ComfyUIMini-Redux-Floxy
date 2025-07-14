// Import types from shared types
import { QueueItem } from '../../../../shared/types/History.js';
// Import PullToRefresh module
import { PullToRefresh } from '../common/pullToRefresh.js';
// Import shared media utilities
import { fetchMediaForCompletedItem, createMediaItemsHtml, addMediaClickHandlers } from '../modules/mediaDisplay.js';

function getEmptyQueueHtml(): string {
    return `
        <div class="empty-queue">
            <div class="icon clock"></div>
            <h3>Queue is Empty</h3>
            <p>No items are currently in the queue.</p>
        </div>
    `;
}

// Function to show/hide clear completed button based on completed items
function updateClearCompletedButton(hasCompletedItems: boolean): void {
    const btnContainer = document.querySelector('.queue-header-buttons');
    if (!btnContainer) return;
    if (hasCompletedItems) {
        // Always reset to just the Clear Completed button
        btnContainer.innerHTML = '';
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-completed-btn';
        clearBtn.className = 'clear-completed-btn';
        clearBtn.textContent = 'Clear Completed';
        clearBtn.onclick = showClearCompletedConfirmation;
        btnContainer.appendChild(clearBtn);
    } else {
        btnContainer.innerHTML = '';
    }
}

// Function to show inline confirmation for clearing completed items
function showClearCompletedConfirmation() {
    const clearBtn = document.getElementById('clear-completed-btn');
    if (!clearBtn) return;

    // Create confirm and cancel buttons
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.className = 'clear-completed-btn confirm';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'clear-completed-btn cancel';

    let isProcessing = false;

    confirmBtn.onclick = async () => {
        if (isProcessing) return;
        isProcessing = true;
        
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = 'Clearing...';
        
        try {
            const response = await fetch('/api/queue/completed', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear completed items');
            await loadQueue();
        } catch (error) {
            console.error('Error clearing completed items:', error);
            confirmBtn.textContent = 'Error';
            // Restore button after error
            setTimeout(() => restoreClearCompletedButton(), 2000);
        } finally {
            // Reset processing flag after operation completes
            isProcessing = false;
        }
    };
    
    cancelBtn.onclick = () => {
        if (isProcessing) return;
        // Immediately restore the original button
        restoreClearCompletedButton();
    };

    // Use the button container for placement
    const btnContainer = document.querySelector('.queue-header-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = '';
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
    }
}

// Restore the original clear completed button ONLY if there are completed items
function restoreClearCompletedButton() {
    // The displayQueue function will handle showing/hiding the button based on completed items
    // So just reload the queue to update the UI
    loadQueue();
}

async function loadQueue() {
    const queueContainer = document.getElementById('queue-container');
    if (!queueContainer) return;
    
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

async function displayQueue(queueData: any) {
    const queueContainer = document.getElementById('queue-container');
    if (!queueContainer) return;
    
    if (!queueData || (Array.isArray(queueData) && queueData.length === 0)) {
        queueContainer.innerHTML = getEmptyQueueHtml();
        updateClearCompletedButton(false);
        return;
    }
    
    let html = '';
    let hasCompletedItems = false;
    
    if (queueData.queue_running && queueData.queue_pending) {
        // If it has queue_running and queue_pending properties
        const runningItems = Array.isArray(queueData.queue_running) ? queueData.queue_running : [queueData.queue_running];
        const pendingItems = Array.isArray(queueData.queue_pending) ? queueData.queue_pending : [queueData.queue_pending];
        const completedItems = Array.isArray(queueData.queue_completed) ? queueData.queue_completed : [queueData.queue_completed];

        // Check if all queue sections are empty
        const hasRunningItems = runningItems.length > 0 && runningItems[0] !== null;
        const hasPendingItems = pendingItems.length > 0 && pendingItems[0] !== null;
        hasCompletedItems = completedItems.length > 0 && completedItems[0] !== null;

        if (!hasRunningItems && !hasPendingItems && !hasCompletedItems) {
            queueContainer.innerHTML = getEmptyQueueHtml();
            updateClearCompletedButton(false);
            return;
        }

        // Handle all items concurrently for better performance
        const pendingPromises = hasPendingItems ? pendingItems.map((item: QueueItem) => createQueueItemHtml(item, 'Pending')) : [];
        const runningPromises = hasRunningItems ? runningItems.map((item: QueueItem) => createQueueItemHtml(item, 'Running')) : [];
        const completedPromises = hasCompletedItems ? completedItems.reverse().map((item: QueueItem) => createQueueItemHtml(item, 'Completed')) : [];
        
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
    
    // Update clear completed button visibility
    updateClearCompletedButton(hasCompletedItems);
    
    // Add click handlers for images and videos after DOM is updated
    addMediaClickHandlers('.queue-item-images', '.image-item img');
}

async function createQueueItemHtml(item: QueueItem, status: string = 'pending'): Promise<string> {
    const promptId = item[1];
    
    // Use workflow name directly from the queue data
    const title = item.workflowName || `Item ${promptId}`;
    
    let imagesHtml = '';
    
    if (status === 'Completed') {
        // Use shared utility to fetch and extract media items
        const mediaItems = await fetchMediaForCompletedItem(promptId);
        
        // Create HTML for images and videos using shared utility
        imagesHtml = createMediaItemsHtml(mediaItems);
    }
    
    return `
        <div class="queue-item">
            <div class="queue-item-header">
                <div class="queue-item-info">
                    <div class="queue-item-title">${title}</div>
                </div>
                <div class="queue-item-status ${status}">
                    ${status}
                </div>
            </div>
            ${imagesHtml}
        </div>
    `;
}



// Load queue when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQueue();
    
    // Add event listener for clear completed button
    const clearBtn = document.getElementById('clear-completed-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', showClearCompletedConfirmation);
    }
});

// Initialize pull-to-refresh functionality
const pullToRefresh = new PullToRefresh({
    threshold: 100,
    onRefresh: loadQueue,
    indicatorId: 'pull-indicator'
});
pullToRefresh.init();