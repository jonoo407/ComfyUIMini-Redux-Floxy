// Import types from shared types
import { QueueItem } from '../../../../shared/types/History.js';
// Import PullToRefresh module
import { PullToRefresh } from '../common/pullToRefresh.js';
// Import shared media utilities
import { fetchMediaForCompletedItem, createMediaItemsHtml, addMediaClickHandlers } from '../common/mediaDisplay.js';



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
        
        // Add event listeners for both click and touch events (mobile-friendly)
        const handleClearClick = (e: Event) => {
            e.preventDefault();
            
            showClearCompletedConfirmation();
        };
        
        // Add both click and touchstart listeners for mobile compatibility
        clearBtn.addEventListener('click', handleClearClick);
        clearBtn.addEventListener('touchstart', handleClearClick, { passive: false });
        
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

    // Use the button container for placement
    const btnContainer = document.querySelector('.queue-header-buttons');
    if (btnContainer) {
        btnContainer.innerHTML = '';
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
    }

    // Add click handlers after 300ms delay to prevent rapid flipping
    setTimeout(() => {
        const handleConfirmClick = async (e: Event) => {
            e.preventDefault();
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
                
                updateClearCompletedButton(true); // Re-show the original button
            }
        };
        
        const handleCancelClick = (e: Event) => {
            e.preventDefault();
            
            updateClearCompletedButton(true); // Re-show the original button
        };
        
        // Add both click and touchstart listeners for mobile compatibility
        confirmBtn.addEventListener('click', handleConfirmClick);
        confirmBtn.addEventListener('touchstart', handleConfirmClick, { passive: false });
        
        cancelBtn.addEventListener('click', handleCancelClick);
        cancelBtn.addEventListener('touchstart', handleCancelClick, { passive: false });
    }, 300);
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
    
    // Add click handlers for images and videos after DOM is updated with "Use as Input" enabled
    addMediaClickHandlers('.queue-item-images', {
        enableUseAsInput: true,
        imageSelector: '.image-item img'
    });
}

async function createQueueItemHtml(item: QueueItem, status: string = 'pending'): Promise<string> {
    const promptId = item[1];
    
    // Use workflow name directly from the queue data
    const title = item.workflowName || `Item ${promptId}`;
    
    let imagesHtml = '';
    
    if (status === 'Completed') {
        // Use shared utility to fetch and extract media items
        const mediaItems = await fetchMediaForCompletedItem(promptId);
        
        // Create HTML for images and videos using shared utility with "Use as Input" enabled
        imagesHtml = createMediaItemsHtml(mediaItems, {
            enableUseAsInput: true,
            containerClass: 'queue-item-images',
            itemClass: 'image-item' // unified class
        });
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
});

// Initialize pull-to-refresh functionality
const pullToRefresh = new PullToRefresh({
    threshold: 100,
    onRefresh: loadQueue,
    indicatorId: 'pull-indicator'
});
pullToRefresh.init();