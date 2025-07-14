import { comfyUIAxios } from '../comfyUIAxios';
import logger from "server/utils/logger";
import { QueueItem } from '@shared/types/History';

// Define the ComfyUI queue response structure
interface ComfyUIQueueResponse {
    queue_running: QueueItem[] | QueueItem | null;
    queue_pending: QueueItem[] | QueueItem | null;
    queue_completed?: QueueItem[] | QueueItem | null;
}

// Define our enhanced queue response with workflow names
interface EnhancedQueueResponse extends ComfyUIQueueResponse {
    queue_running: QueueItem[];
    queue_pending: QueueItem[];
    queue_completed: QueueItem[];
}

// Server-side storage for tracking completed queue items
let previousQueueItems = new Map<string, QueueItem>();
const completedItems = new Map<string, QueueItem>();

// Map to store workflow names by prompt ID
const workflowNamesByPromptId = new Map<string, string>();

/**
 * Stores a workflow name for a given prompt ID
 * @param promptId The prompt ID from ComfyUI
 * @param workflowName The name of the workflow
 */
export function storeWorkflowName(promptId: string, workflowName: string): void {
    workflowNamesByPromptId.set(promptId, workflowName);
}

/**
 * Gets the workflow name for a given prompt ID
 * @param promptId The prompt ID from ComfyUI
 * @returns The workflow name or undefined if not found
 */
export function getWorkflowName(promptId: string): string | undefined {
    return workflowNamesByPromptId.get(promptId);
}

/**
 * Removes a workflow name from the map (called when item is completed)
 * @param promptId The prompt ID to remove
 */
export function removeWorkflowName(promptId: string): void {
    workflowNamesByPromptId.delete(promptId);
}

/**
 * Normalizes queue items to always be an array
 * @param items Queue items that could be single item, array, or null
 * @returns Array of queue items
 */
function normalizeQueueItems(items: QueueItem[] | QueueItem | null): QueueItem[] {
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
}

/**
 * Adds workflow names to queue items
 * @param items Array of queue items
 * @returns Array of queue items with workflow names
 */
function addWorkflowNamesToItems(items: QueueItem[]): QueueItem[] {
    return items.map((item: QueueItem) => {
        if (item && item[1]) {
            const workflowName = getWorkflowName(item[1]);
            return {
                ...item,
                workflowName: workflowName || `Item ${item[1]}`
            };
        }
        return item;
    });
}

/**
 * Filters out null/undefined items from queue
 * @param items Array of queue items
 * @returns Array of valid queue items
 */
function filterValidItems(items: QueueItem[]): QueueItem[] {
    return items.filter((item: QueueItem): item is QueueItem => 
        item !== null && item !== undefined && item[1] !== undefined
    );
}

async function getQueue(): Promise<EnhancedQueueResponse> {
    const response = await comfyUIAxios.get<ComfyUIQueueResponse>('/queue');
    const queueData = response.data;
    
    // Track completed items
    const currentQueueItems = new Map<string, QueueItem>();
    
    if (queueData.queue_running && queueData.queue_pending) {
        // Normalize all queue sections to arrays
        const runningItems = filterValidItems(normalizeQueueItems(queueData.queue_running));
        const pendingItems = filterValidItems(normalizeQueueItems(queueData.queue_pending));
        
        // Track current items
        runningItems.forEach((item: QueueItem) => {
            if (item[1]) {
                currentQueueItems.set(item[1], item);
            }
        });
        
        pendingItems.forEach((item: QueueItem) => {
            if (item[1]) {
                currentQueueItems.set(item[1], item);
            }
        });
        
        // Check for completed items (items that were in previous queue but not in current)
        previousQueueItems.forEach((item: QueueItem, itemId: string) => {
            if (!currentQueueItems.has(itemId)) {
                // This item was completed
                completedItems.set(itemId, item);
                
                // Keep only the last 50 completed items
                if (completedItems.size > 50) {
                    const firstKey = completedItems.keys().next().value;
                    if (firstKey) {
                        completedItems.delete(firstKey);
                        // Clean up workflow name mapping only when item is removed from completedItems
                        removeWorkflowName(firstKey);
                    }
                }
            }
        });
        
        // Update previous queue items for next comparison
        previousQueueItems = new Map(currentQueueItems);
        
        // Add completed items to the response
        const completedItemsArray = Array.from(completedItems.values());

        // Add workflow names to all queue items
        const runningWithNames = addWorkflowNamesToItems(runningItems);
        const pendingWithNames = addWorkflowNamesToItems(pendingItems);
        const completedWithNames = addWorkflowNamesToItems(completedItemsArray);

        logger.logOptional('fetch_queue', `Running: ${runningItems.length} Pending: ${pendingItems.length} Completed: ${completedItemsArray.length}`);
        
        return {
            ...queueData,
            queue_running: runningWithNames,
            queue_pending: pendingWithNames,
            queue_completed: completedWithNames
        };
    }
    
    // Return empty arrays if no queue data
    return {
        queue_running: [],
        queue_pending: [],
        queue_completed: []
    };
}

/**
 * Gets completed queue items filtered by workflow name
 * @param workflowName The workflow name to filter by
 * @returns Array of completed queue items matching the workflow name
 */
export async function getCompletedItemsByWorkflowName(workflowName: string): Promise<QueueItem[]> {
    const queueData = await getQueue();
    const completedItems = queueData.queue_completed || [];
    
    return completedItems.filter((item: QueueItem) => {
        if (!item || !item[1]) return false;
        const itemWorkflowName = getWorkflowName(item[1]);
        return itemWorkflowName === workflowName;
    });
}

/**
 * Clears all completed items from the queue storage
 */
export function clearCompletedItems(): void {
    // Clear all completed items
    completedItems.clear();
    
    // Clear all workflow name mappings for completed items
    workflowNamesByPromptId.clear();
    
    logger.logOptional('fetch_queue', 'Cleared all completed queue items');
}

export default getQueue;
