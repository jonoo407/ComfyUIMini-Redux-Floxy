import logger from "server/utils/logger";
import handleComfyWsError from "./onError";
import WebSocket from 'ws';
import getQueue from "../../getQueue";
import sendCachedImages from "../sendCachedImages";
import { QueueItem } from "@shared/types/History";

async function handleOpenComfyWsConnection(clientWs: WebSocket, promptId: string) {
    try {
        logger.logOptional('queue_image', `Queued image: ${promptId}`);

        const queueJson = await getQueue();

        // Check if our prompt is currently running
        if (queueJson['queue_running'].length > 0) {
            const runningItem = queueJson['queue_running'][0] as QueueItem;
            const runningPromptId = runningItem[1];
            
            if (runningPromptId === promptId) {
                // Our prompt is running, send workflow structure for progress tracking
                const workflowStructure = runningItem[2] || {};
                clientWs.send(JSON.stringify({ 
                    type: 'workflow_structure', 
                    data: {
                        totalNodes: Object.keys(workflowStructure).length,
                        workflow: workflowStructure,
                        promptId: promptId
                    }
                }));
                return;
            }
            
            // Different prompt is running, wait for ours
            logger.logOptional('queue_image', `Different prompt (${runningPromptId}) is currently running, waiting for our prompt (${promptId})`);
            return;
        }

        // No running queue, check if our prompt is pending
        const isPending = queueJson['queue_pending'].some((item: QueueItem) => item[1] === promptId);
        
        if (isPending) {
            logger.logOptional('queue_image', `Prompt ${promptId} is in pending queue, waiting for it to start`);
            return;
        }

        // Not running or pending, likely cached - send cached images
        sendCachedImages(clientWs, promptId);
        
    } catch (error) {
        handleComfyWsError(clientWs, error);
    }
}

export default handleOpenComfyWsConnection;