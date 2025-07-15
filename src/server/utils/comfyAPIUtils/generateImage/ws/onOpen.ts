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

        if (queueJson['queue_running'][0] === undefined) {
            // If there is no running queue after we have queued an image that most likely
            // means that we have ran the workflow before and ComfyUI is reusing the output image.

            sendCachedImages(clientWs, promptId);
        } else {
            // Otherwise, we have queued generating the image.

            const runningItem = queueJson['queue_running'][0] as QueueItem;
            const workflowStructure = runningItem[2] || {};
            
            // Send complete workflow structure for progress bar initialization
            clientWs.send(JSON.stringify({ 
                type: 'workflow_structure', 
                data: {
                    totalNodes: Object.keys(workflowStructure).length,
                    workflow: workflowStructure,
                    promptId: promptId
                }
            }));
        }
    } catch (error) {
        handleComfyWsError(clientWs, error);
    }
}

export default handleOpenComfyWsConnection;