import logger from "server/utils/logger";
import WebSocket from "ws";
import getQueue from "../../getQueue";
import getOutputImages from "../getOutputImages";
import { QueueItem } from "@shared/types/History";

/**
 * Handles recieving messages from ComfyUI WebSocket.
 * @param clientWs The WebSocket connection to the frontend client.
 * @param comfyWs The WebSocket connection to the ComfyUI instance.
 * @param data The data recieved from the ComfyUI WebSocket.
 * @param isBinary Whether the data is binary or not, i.e. if it is an image.
 * @param promptId The prompt ID for the current generation.
 */
async function handleComfyWsMessage(clientWs: WebSocket, comfyWs: WebSocket, data: WebSocket.Data, isBinary: boolean) {
    if (!Buffer.isBuffer(data)) {
        logger.warn('Recieved non-buffer data from ComfyUI websocket:', data);
        return;
    }

    if (isBinary) {
        try {
            handleSendImageBuffer(clientWs, data);
        } catch (error) {
            logger.warn('Failed to handle sending image buffer:', error);
        }
    } else {
        try {
            await handleSendMessage(clientWs, comfyWs, data);
        } catch (error) {
            logger.warn('Failed to handle sending message:', error);
        }
    }
}

function handleSendImageBuffer(clientWs: WebSocket, buffer: Buffer<ArrayBufferLike>) {
    // Handle image buffers like ComfyUI client
    const imageType = buffer.readUInt32BE(0);
    let imageMime;

    switch (imageType) {
        case 1:
            imageMime = 'image/jpeg';
            break;
        case 2:
            imageMime = 'image/png';
            break;
        default:
            imageMime = 'image/jpeg';
    }

    const imageBlob = buffer.slice(8);
    const base64Image = imageBlob.toString('base64');

    const jsonPayload = {
        type: 'preview',
        data: { image: base64Image, mimetype: imageMime },
    };

    clientWs.send(JSON.stringify(jsonPayload));
}

async function handleSendMessage(clientWs: WebSocket, comfyWs: WebSocket, data: Buffer<ArrayBufferLike>) {
    const messageString = data.toString();
    const message = JSON.parse(messageString);

    switch (message.type) {
        case 'status':
            await handleStatusMessage(clientWs, comfyWs, message);
            break;
        case 'progress':
            handleProgressMessage(clientWs, message);
            break;
        case 'executing':
            handleExecutingMessage(clientWs, message);
            break;
        case 'executed':
            handleExecutedMessage(clientWs, message);
            break;
        case 'execution_success':
            await handleExecutionSuccessMessage(clientWs, message);
            break;
        case 'execution_interrupted':
            await handleExecutionInterruptedMessage(clientWs, message);
            break;
    }
}

async function handleStatusMessage(clientWs: WebSocket, comfyWs: WebSocket, message: any) {

    // Nothing else in the queue, just close the connection
    if (message.data.status.exec_info.queue_remaining == 0) {
        comfyWs.close();
        return;
    }
    
    const queueJson = await getQueue();

    // Check if prompt is currently running
    if (queueJson['queue_running'].length > 0) {
        const runningItem = queueJson['queue_running'][0] as QueueItem;
        const runningPromptId = runningItem[1];
        
        // Send workflow structure for progress tracking
        const workflowStructure = runningItem[2] || {};
        clientWs.send(JSON.stringify({ 
            type: 'workflow_structure', 
            data: {
                totalNodes: Object.keys(workflowStructure).length,
                workflow: workflowStructure,
                promptId: runningPromptId
            }
        }));
    }
}

function handleProgressMessage(clientWs: WebSocket, message: any) {
    clientWs.send(JSON.stringify(message));
}

function handleExecutingMessage(clientWs: WebSocket, message: any) {
    clientWs.send(JSON.stringify({
        type: 'node_executing',
        data: {
            node: message.data.node,
            display_node: message.data.display_node,
            prompt_id: message.data.prompt_id
        }
    }));
}

function handleExecutedMessage(clientWs: WebSocket, message: any) {
    clientWs.send(JSON.stringify({
        type: 'node_executed',
        data: {
            node: message.data.node,
            display_node: message.data.display_node,
            output: message.data.output,
            prompt_id: message.data.prompt_id
        }
    }));
}

async function handleExecutionSuccessMessage(clientWs: WebSocket, message: any) {
    logger.logOptional('generation_finish', 'Image generation finished.');
    await sendCompletionMessage(clientWs, message.data.prompt_id);
}

async function handleExecutionInterruptedMessage(clientWs: WebSocket, message: any) {
    logger.logOptional('generation_finish', 'Image generation interrupted.');
    await sendCompletionMessage(clientWs, message.data.prompt_id);
}

async function sendCompletionMessage(clientWs: WebSocket, promptId: string) {
    // Get output images and send completion message
    try {
        const outputImages = await getOutputImages(promptId);

        // Check if we got any images back
        const totalImages = Object.values(outputImages).flat().length;
        
        if (totalImages === 0) {
            logger.logOptional('generation_finish', 'No output images found for prompt ID: ' + promptId);
            return;
        }

        clientWs.send(JSON.stringify({ type: 'completed', data: outputImages }));
    } catch (error) {
        logger.warn('Error retrieving output images: ' + error);
    }
}

export default handleComfyWsMessage;