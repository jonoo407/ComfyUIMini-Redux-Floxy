import getOutputImages from "../getOutputImages";
import WebSocket from 'ws';
import logger from "server/utils/logger";

async function handleComfyWsClose(clientWs: WebSocket, promptId: string) {
    if (typeof promptId !== 'string') {
        clientWs.send(JSON.stringify({ type: 'error', message: 'Uninitialised promptId.' }));
        return;
    }

    try {
        const outputImages = await getOutputImages(promptId);

        // Check if we got any images back
        const totalImages = Object.values(outputImages).flat().length;
        
        if (totalImages === 0) {
            logger.logOptional('ws_close', 'No output images found for prompt ID: ' + promptId);
            clientWs.send(JSON.stringify({ type: 'error', message: 'No output images found for this generation. The image may still be processing or the cache may have been cleared.' }));
            return;
        }

        clientWs.send(JSON.stringify({ type: 'completed', data: outputImages }));
        logger.logOptional('ws_close', `Successfully sent ${totalImages} output images for prompt ID: ${promptId}`);
    } catch (error) {
        logger.logOptional('ws_close', 'Error retrieving output images: ' + error);
        clientWs.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve output images. Please try running the workflow again.' }));
    }
}

export default handleComfyWsClose;