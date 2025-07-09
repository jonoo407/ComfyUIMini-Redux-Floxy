// Import imageModal functions for handling images only
import { openImageModal } from '../common/imageModal.js';
// Import types from shared types
import { QueueItem, HistoryData, HistoryOutput, MediaItem } from '../../../../shared/types/History.js';

async function loadQueue() {
    const queueContainer = document.getElementById('queue-container');
    if (!queueContainer) return;
    
    try {
        const response = await fetch('/api/queue');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const queueData = await response.json();
        console.log(queueData);
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
        const pendingPromises = pendingItems.map((item: QueueItem) => createQueueItemHtml(item, 'Pending'));
        const runningPromises = runningItems.map((item: QueueItem) => createQueueItemHtml(item, 'Running'));
        const completedPromises = completedItems.reverse().map((item: QueueItem) => createQueueItemHtml(item, 'Completed'));
        
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
                console.log(historyData);
                
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

// Set up pull-to-refresh functionality for PWA
let startY = 0;
let currentY = 0;
let isPulling = false;
const pullThreshold = 100; // pixels to pull down before triggering refresh

// Get the pull indicator from the DOM
let pullIndicator: HTMLElement | null = null;

// Function to get or initialize pull indicator
function getPullIndicator(): HTMLElement | null {
    if (!pullIndicator) {
        pullIndicator = document.getElementById('pull-indicator');
        if (pullIndicator) {
            // Initially hide the pull indicator
            pullIndicator.style.transform = 'translateY(-60px)';
        }
    }
    return pullIndicator;
}

// Function to update pull indicator visibility and position
function updatePullIndicator(pullDistance: number): void {
    const indicator = getPullIndicator();
    if (!indicator) return;
    
    if (pullDistance > 0) {
        // Limit the maximum pull distance to prevent going too far
        const maxPullDistance = pullThreshold + 20;
        const limitedPullDistance = Math.min(pullDistance, maxPullDistance);
        const pullPercentage = limitedPullDistance / pullThreshold;
        const indicatorOffset = -60 + (pullPercentage * 60);
        
        // Ensure the indicator doesn't go beyond the maximum
        const finalOffset = Math.min(indicatorOffset, 20);
        
        indicator.style.transform = `translateY(${finalOffset}px)`;
        
        const pullText = indicator.querySelector('.pull-text') as HTMLElement;
        const pullIcon = indicator.querySelector('.pull-icon') as HTMLElement;
        
        if (pullDistance >= pullThreshold) {
            pullText.textContent = 'Release to refresh';
            pullIcon.textContent = '↑';
        } else {
            pullText.textContent = 'Pull down to refresh';
            pullIcon.textContent = '↓';
        }
    } else {
        indicator.style.transform = 'translateY(-60px)';
    }
}

// PWA-compatible touch handling
function handleTouchStart(e: TouchEvent): void {
    // Only allow pull-to-refresh when at the top of the page
    if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
    } else {
        isPulling = false;
    }
}

function handleTouchMove(e: TouchEvent): void {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 0) {
        // Update pull indicator
        updatePullIndicator(pullDistance);
        
        // Prevent the page from scrolling past the top
        e.preventDefault();
        e.stopPropagation();
    }
}

function handleTouchEnd(e: TouchEvent): void {
    if (!isPulling) return;
    
    const pullDistance = currentY - startY;
    const indicator = getPullIndicator();
    
    if (pullDistance > pullThreshold) {
        // Show loading state
        const pullText = indicator?.querySelector('.pull-text') as HTMLElement;
        const pullIcon = indicator?.querySelector('.pull-icon') as HTMLElement;
        if (pullText && pullIcon) {
            pullText.textContent = 'Refreshing...';
            pullIcon.textContent = '⟳';
        }
        
        // Trigger refresh
        loadQueue().then(() => {
            // Hide indicator after refresh completes
            setTimeout(() => {
                updatePullIndicator(0);
            }, 500);
        });
    } else {
        // Hide pull indicator if not enough pull
        updatePullIndicator(0);
    }
    
    isPulling = false;
}

// Add event listeners with proper options for PWA
document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: true });