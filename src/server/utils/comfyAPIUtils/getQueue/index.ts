import { comfyUIAxios } from '../comfyUIAxios';
import logger from "server/utils/logger";

// Server-side storage for tracking completed queue items
let previousQueueItems = new Map();
const completedItems = new Map();

async function getQueue() {
    const response = await comfyUIAxios.get('/queue');
    const queueData = response.data;
    
    // Track completed items
    const currentQueueItems = new Map();
    
    if (queueData.queue_running && queueData.queue_pending) {
        const runningItems = Array.isArray(queueData.queue_running) ? queueData.queue_running : [queueData.queue_running];
        const pendingItems = Array.isArray(queueData.queue_pending) ? queueData.queue_pending : [queueData.queue_pending];
        
        // Filter out null/undefined items and track current items
        const allItems = [...runningItems, ...pendingItems].filter(item => item);
        
        allItems.forEach(item => {
            if (item && item[1]) {
                currentQueueItems.set(item[1], item);
            }
        });
        
        // Check for completed items (items that were in previous queue but not in current)
        previousQueueItems.forEach((item, itemId) => {
            if (!currentQueueItems.has(itemId)) {
                // This item was completed
                completedItems.set(itemId, item);
                
                // Keep only the last 50 completed items
                if (completedItems.size > 50) {
                    const firstKey = completedItems.keys().next().value;
                    completedItems.delete(firstKey);
                }
            }
        });
        
        // Update previous queue items for next comparison
        previousQueueItems = new Map(currentQueueItems);
        
        // Add completed items to the response
        const completedItemsArray = Array.from(completedItems.values());

        logger.logOptional('fetch_queue', `Running: ${runningItems.length} Pending: ${pendingItems.length} Completed: ${completedItemsArray.length}`);
        
        return {
            ...queueData,
            queue_completed: completedItemsArray
        };
    }
    
    return queueData;
}

export default getQueue;
