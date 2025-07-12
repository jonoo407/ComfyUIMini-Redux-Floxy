// Import imageModal functions for handling images only
import { openImageModal } from '../common/imageModal.js';
// Import types from shared types
import { QueueItem, HistoryData, HistoryOutput, MediaItem } from '../../../../shared/types/History.js';
// Import PullToRefresh module
import { PullToRefresh } from '../common/pullToRefresh.js';

function getEmptyQueueHtml(): string {
    return `
        <div class="empty-queue">
            <div class="icon clock"></div>
            <h3>Queue is Empty</h3>
            <p>No items are currently in the queue.</p>
        </div>
    `;
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
        return;
    }
    
    let html = '';
    
    if (queueData.queue_running && queueData.queue_pending) {
        // If it has queue_running and queue_pending properties
        const runningItems = Array.isArray(queueData.queue_running) ? queueData.queue_running : [queueData.queue_running];
        const pendingItems = Array.isArray(queueData.queue_pending) ? queueData.queue_pending : [queueData.queue_pending];
        const completedItems = Array.isArray(queueData.queue_completed) ? queueData.queue_completed : [queueData.queue_completed];

        // Check if all queue sections are empty
        const hasRunningItems = runningItems.length > 0 && runningItems[0] !== null;
        const hasPendingItems = pendingItems.length > 0 && pendingItems[0] !== null;
        const hasCompletedItems = completedItems.length > 0 && completedItems[0] !== null;

        if (!hasRunningItems && !hasPendingItems && !hasCompletedItems) {
            queueContainer.innerHTML = getEmptyQueueHtml();
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
    
    // Add click handlers for images and videos after DOM is updated
    addMediaClickHandlers();
}

async function createQueueItemHtml(item: QueueItem, status: string = 'pending'): Promise<string> {
    const promptId = item[1];
    const title = `Item ${promptId}`;
    let imagesHtml = '';
    
    if (status === 'Completed') {
        try {
            // Fetch history for the completed item
            const response = await fetch(`/comfyui/history/${promptId}`);
            if (response.ok) {
                const historyData: HistoryData = await response.json();
                
                // Extract image and video URLs from the history response
                const mediaItems: MediaItem[] = [];
                if (historyData[promptId] && historyData[promptId].outputs) {
                    Object.values(historyData[promptId].outputs).forEach((output: HistoryOutput) => {
                        // Handle images
                        if (output.images) {
                            output.images.forEach((image: { filename: string; subfolder: string; type: string }) => {
                                const mediaUrl = `/comfyui/image?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                                mediaItems.push({
                                    url: mediaUrl,
                                    isVideo: false,
                                    filename: image.filename
                                });
                            });
                        }
                        
                        // Handle videos
                        if (output.videos) {
                            output.videos.forEach((video: { filename: string; subfolder: string; type: string; format: string; frame_rate: number; fullpath: string }) => {
                                const mediaUrl = `/comfyui/image?filename=${video.filename}&subfolder=${video.subfolder}&type=${video.type}`;
                                mediaItems.push({
                                    url: mediaUrl,
                                    isVideo: true,
                                    filename: video.filename
                                });
                            });
                        }
                    });
                }
                
                // Create HTML for images and videos
                if (mediaItems.length > 0) {
                    imagesHtml = `
                        <div class="queue-item-images">
                            ${mediaItems.map((item: MediaItem) => {
                                if (item.isVideo) {
                                    return `
                                        <div class="image-item">
                                            <video src="${item.url}" alt="Generated video" style="cursor: pointer;">
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="image-item">
                                            <img src="${item.url}" alt="Generated image" style="cursor: pointer;">
                                        </div>
                                    `;
                                }
                            }).join('')}
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
                    ${status}
                </div>
            </div>
            ${imagesHtml}
        </div>
    `;
}

// Add click handlers to all images in the queue (videos don't need modal)
function addMediaClickHandlers(): void {
    const images = document.querySelectorAll('.queue-item-images .image-item img');
    
    images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        imageElement.addEventListener('click', (e) => {
            e.preventDefault();
            const imageSrc = imageElement.src;
            const imageAlt = imageElement.alt || 'Queue image';
            openImageModal(imageSrc, imageAlt);
        });
    });
}

// Load queue when page loads
document.addEventListener('DOMContentLoaded', loadQueue);

// Initialize pull-to-refresh functionality
const pullToRefresh = new PullToRefresh({
    threshold: 100,
    onRefresh: loadQueue,
    indicatorId: 'pull-indicator'
});
pullToRefresh.init();